import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { receivedEmails } from "@/db/schema";
import { sendEmail } from "@/lib/email/brevo";
import { limit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024;

type BrevoMailbox = {
  Address: string;
  Name?: string;
};

type BrevoInboundItem = {
  From: BrevoMailbox;
  To: BrevoMailbox[];
  Subject?: string;
  RawHtmlBody?: string;
  RawTextBody?: string;
  ExtractedMarkdownMessage?: string;
  MessageId?: string;
  Uuid?: string[];
};

type BrevoInboundPayload = {
  items: BrevoInboundItem[];
};

function extractEmailData(body: unknown) {
  const payload = body as BrevoInboundPayload;

  if (payload?.items?.length) {
    const item = payload.items[0];
    return {
      sender: item.From?.Address || "",
      recipient: item.To?.map((t) => t.Address).join(", ") || "",
      subject: item.Subject || "",
      bodyText: item.RawTextBody || item.ExtractedMarkdownMessage || "",
      bodyHtml: item.RawHtmlBody || "",
      messageId: item.MessageId || "",
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await limit(`email-inbound:${ip}`);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const raw = await request.text();
    const parsed = JSON.parse(raw);
    const data = extractEmailData(parsed);

    if (!data || !data.sender || !data.recipient) {
      return NextResponse.json({ error: "Missing from/to fields" }, { status: 400 });
    }

    await db.insert(receivedEmails).values({
      recipient: data.recipient,
      sender: data.sender,
      subject: data.subject,
      bodyText: data.bodyText,
      bodyHtml: data.bodyHtml,
      messageId: data.messageId,
      source: "brevo-inbound",
    });

    const centralInbox = process.env.CENTRAL_INBOX_EMAIL;
    if (centralInbox) {
      const aliasLabel = data.recipient.toLowerCase();
      sendEmail({
        to: centralInbox,
        subject: `[${aliasLabel}] ${data.subject}`,
        html: `<p><strong>From:</strong> ${data.sender}</p>
<p><strong>To:</strong> ${data.recipient}</p>
<p><strong>Subject:</strong> ${data.subject}</p>
<hr>
${data.bodyHtml || `<pre>${data.bodyText}</pre>`}`,
        text: `From: ${data.sender}\nTo: ${data.recipient}\nSubject: ${data.subject}\n\n${data.bodyText}`,
        from: process.env.FROM_EMAIL || "hello@leish.my",
        fromName: "Leish Inbound",
      }).catch((err) => console.error("Forward to inbox failed:", err));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Inbound email error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
