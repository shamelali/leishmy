import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { sendEmail } from "@/lib/email/brevo";
import { sendContactAckEmail } from "@/lib/email";
import { limit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().toLowerCase().email(),
  location: z.string().trim().max(255).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(5000),
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await limit(`contact:${ip}`);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, location, message } = parsed.data;

    const [contact] = await db
      .insert(contacts)
      .values({ name, email, location, message: message || "" })
      .returning();

    const supportEmail = process.env.SUPPORT_EMAIL || "support@leish.my";
    sendEmail({
      to: supportEmail,
      subject: `Contact Form: ${escapeHtml(name)}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
${location ? `<p><strong>Location:</strong> ${escapeHtml(location)}</p>` : ""}
<p><strong>Message:</strong></p>
<p>${escapeHtml(message)}</p>`,
      text: `Name: ${name}\nEmail: ${email}${location ? `\nLocation: ${location}` : ""}\nMessage:\n${message}`,
    }).catch((err) => console.error("Contact form email notify failed:", err));

    sendContactAckEmail({ email, name }).catch((err) =>
      console.error("Contact form auto-ack failed:", err),
    );

    return NextResponse.json({ success: true, contact });
  } catch (error) {
    console.error("Contact error:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    );
  }
}
