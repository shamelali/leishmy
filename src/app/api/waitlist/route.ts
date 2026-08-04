import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { sendWaitlistWelcomeEmail } from "@/lib/email/waitlist";
import { limit } from "@/lib/rate-limit";

const waitlistSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await limit(`waitlist:${ip}`);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const body = await request.json();
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email } = parsed.data;

    const [contact] = await db
      .insert(contacts)
      .values({ name, email, message: "waitlist" })
      .returning();

    sendWaitlistWelcomeEmail({ email, name }).catch((err) =>
      console.error("Waitlist welcome email failed:", err),
    );

    return NextResponse.json({ success: true, contact });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}