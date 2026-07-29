import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { receivedEmails } from "@/db/schema";
import { sendEmail } from "@/lib/email/brevo";
import { limit } from "@/lib/rate-limit";
import { getDestination } from "@/lib/email/aliases";
import PostalMime from "postal-mime";

export const runtime = "nodejs";

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024;

interface ParsedEmail {
  html?: string;
  text?: string;
  subject?: string;
  from?: string;
  to?: string;
  messageId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await limit(`email-cloudflare:${ip}`);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // Cloudflare Email Routing sends raw MIME message
    const rawText = await request.text();

    // Parse the MIME message
    let parsed: ParsedEmail = {};
    try {
      const result = await new PostalMime().parse(rawText);
      parsed = {
        html: result.html,
        text: result.text,
        subject: result.subject,
        from: result.from?.address,
        to: result.to?.map(t => t.address).join(", "),
        messageId: result.messageId,
      };
    } catch (parseErr) {
      console.error("Failed to parse email body:", parseErr);
    }

    const recipient = (parsed.to || "").toLowerCase().trim();
    const destination = getDestination(recipient);

    if (!parsed.from || !recipient) {
      return NextResponse.json({ error: "Missing from/to fields" }, { status: 400 });
    }

    // Store the email
    await db.insert(receivedEmails).values({
      recipient,
      sender: parsed.from,
      subject: parsed.subject || "",
      bodyText: parsed.text || null,
      bodyHtml: parsed.html || null,
      messageId: parsed.messageId || null,
      source: "cloudflare-worker",
    });

    // Forward to destination
    const centralInbox = process.env.CENTRAL_INBOX_EMAIL;
    if (centralInbox) {
      const aliasLabel = recipient;
      sendEmail({
        to: destination,
        subject: `[${aliasLabel}] ${parsed.subject || "(no subject)"}`,
        html: `<p><strong>From:</strong> ${parsed.from}</p>
<p><strong>To:</strong> ${recipient}</p>
<p><strong>Subject:</strong> ${parsed.subject || ""}</p>
<hr>
${parsed.html || `<pre>${parsed.text || ""}</pre>`}`,
        text: `From: ${parsed.from}\nTo: ${recipient}\nSubject: ${parsed.subject || ""}\n\n${parsed.text || ""}`,
        from: process.env.FROM_EMAIL || "hello@leish.my",
        fromName: "Leish Inbound",
      }).catch((err) => console.error("Forward to destination failed:", err));

      // Also send to central inbox
      if (destination !== centralInbox) {
        sendEmail({
          to: centralInbox,
          subject: `[${aliasLabel}] ${parsed.subject || "(no subject)"}`,
          html: `<p><strong>From:</strong> ${parsed.from}</p>
<p><strong>To:</strong> ${recipient}</p>
<p><strong>Subject:</strong> ${parsed.subject || ""}</p>
<hr>
${parsed.html || `<pre>${parsed.text || ""}</pre>`}`,
          text: `From: ${parsed.from}\nTo: ${recipient}\nSubject: ${parsed.subject || ""}\n\n${parsed.text || ""}`,
          from: process.env.FROM_EMAIL || "hello@leish.my",
          fromName: "Leish Inbound",
        }).catch((err) => console.error("Forward to central inbox failed:", err));
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Cloudflare inbound email error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
