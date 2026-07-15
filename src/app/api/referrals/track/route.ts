import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { referrals } from "@/db/schema";
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

    const referrerIdNum = Number(referrerId);
    if (!Number.isFinite(referrerIdNum) || referrerIdNum <= 0) {
      return NextResponse.json({ error: "Invalid referrerId" }, { status: 400 });
    }

    await db.insert(referrals).values({
      referrerType,
      referrerId: referrerIdNum,
      status: "clicked",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
