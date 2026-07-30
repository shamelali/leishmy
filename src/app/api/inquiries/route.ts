import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inquiries, profiles, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendEmail } from "@/lib/email/brevo";
import { limit } from "@/lib/rate-limit";
import { getSession } from "@/lib/auth/auth";
import { escapeHtml } from "@/lib/html-escape";
import { createInquirySchema } from "@/lib/validations/inquiries";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await limit(`inquiry:${ip}`);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = createInquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { artistId, name, email, phone, location, message } = parsed.data;

    if (phone && !/^(\+?6?0)\d{8,11}$/.test(phone.replace(/[\s-]/g, ""))) {
      return NextResponse.json(
        { error: "Invalid phone number format. Please enter a valid Malaysian phone number." },
        { status: 400 },
      );
    }

    const [artist] = await db
      .select({ userId: profiles.userId, name: users.name, email: users.email })
      .from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId))
      .where(and(eq(profiles.userId, String(artistId)), eq(profiles.role, "artist")))
      .limit(1);

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const [inquiry] = await db
      .insert(inquiries)
      .values({
        artistId: String(artistId),
        name,
        email,
        phone: phone ? phone.replace(/[\s-]/g, "") : null,
        location: location || null,
        message,
      })
      .returning();

    if (artist.email) {
      sendEmail({
        to: artist.email,
        subject: `New Inquiry from ${escapeHtml(name)}`,
        html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> ${escapeHtml(email)}</p>
${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
${location ? `<p><strong>Location:</strong> ${escapeHtml(location)}</p>` : ""}
<p><strong>Message:</strong></p>
<p>${escapeHtml(message)}</p>
<hr/>
<p style="color:#666;font-size:12px;">This inquiry was sent via your Leish artist profile.</p>`,
        text: `New Inquiry from ${name}\n\nName: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ""}${location ? `\nLocation: ${location}` : ""}\nMessage:\n${message}\n\n---\nThis inquiry was sent via your Leish artist profile.`,
      }).catch((err) => {
        console.error("Inquiry email notify failed:", err);
        Sentry.captureException(err, { extra: { artistId, artistEmail: artist.email, inquiryId: inquiry.id } });
      });
    }

    return NextResponse.json({ success: true, inquiry });
  } catch (error) {
    console.error("Inquiry POST error:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");

    if (!artistId) {
      return NextResponse.json({ error: "artistId is required" }, { status: 400 });
    }

    const [artist] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(and(eq(profiles.userId, String(artistId)), eq(profiles.role, "artist")))
      .limit(1);

    if (!artist || artist.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const status = searchParams.get("status");
    const conditions = [eq(inquiries.artistId, String(artistId))];
    if (status && ["pending", "read", "replied", "closed"].includes(status)) {
      conditions.push(eq(inquiries.status, status));
    }

    const rows = await db
      .select()
      .from(inquiries)
      .where(and(...conditions))
      .orderBy(desc(inquiries.createdAt));

    return NextResponse.json({ inquiries: rows });
  } catch (error) {
    console.error("Inquiry GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries" },
      { status: 500 },
    );
  }
}
