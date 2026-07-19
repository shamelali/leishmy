import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { referrals, profiles } from "@/db/schema";
import { limit } from "@/lib/rate-limit";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "anonymous";
  const rl = await limit(`referral_track:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { referrerType, referrerId } = body;

    if (!referrerType || !referrerId) {
      return NextResponse.json({ error: "referrerType and referrerId are required" }, { status: 400 });
    }

    if (referrerType !== "artist" && referrerType !== "studio") {
      return NextResponse.json({ error: "referrerType must be 'artist' or 'studio'" }, { status: 400 });
    }

    const [referrer] = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(and(eq(profiles.slug, String(referrerId)), eq(profiles.role, referrerType)))
      .limit(1);

    if (!referrer) {
      return NextResponse.json({ error: "Referrer not found" }, { status: 404 });
    }

    await db.insert(referrals).values({
      referrerType,
      referrerUserId: referrer.userId,
      status: "clicked",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
