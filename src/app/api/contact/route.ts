import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { sendEmail } from "@/lib/email/brevo";
import { limit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await limit(`contact:${ip}`);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [contact] = await db
      .insert(contacts)
      .values({ name, email, message })
      .returning();

    const supportEmail = process.env.SUPPORT_EMAIL || "support@leish.my";
    sendEmail({
      to: supportEmail,
      subject: `Contact Form: ${name}`,
      html: `<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Message:</strong></p>
<p>${message}</p>`,
      text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    }).catch((err) => console.error("Contact form email notify failed:", err));

    return NextResponse.json({ success: true, contact });
  } catch (error) {
    console.error("Contact error:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    );
  }
}
