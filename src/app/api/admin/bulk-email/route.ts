import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/server";
import { hasAdminAccess } from "@/lib/auth/admin";
import { sendEmail } from "@/lib/email/brevo";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !hasAdminAccess(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subject, html, text, to, role } = await request.json();
    if (!subject || !html || !text)
      return NextResponse.json({ error: "subject, html, text required" }, { status: 400 });

    let emails: string[] = [];
    if (to && Array.isArray(to)) {
      emails = to;
    } else if (role) {
      // Could fetch emails by role from DB if needed
      return NextResponse.json({ error: "role-based targeting not yet implemented" }, { status: 501 });
    } else {
      return NextResponse.json({ error: "to array required" }, { status: 400 });
    }

    const results = await Promise.allSettled(
      emails.map((email) => sendEmail({ to: email, subject, html, text }))
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return NextResponse.json({ sent, total: emails.length });
  } catch (error) {
    console.error("Bulk email error:", error);
    return NextResponse.json({ error: "Failed to send bulk email" }, { status: 500 });
  }
}