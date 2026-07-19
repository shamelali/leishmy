import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { referrals, profiles } from "@/db/schema";
import { getAuthSession } from "@/lib/auth/server";
import { eq, and, sql, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const referrerType = searchParams.get("referrerType") || "artist";
    const referrerId = searchParams.get("referrerId");

    let resolvedReferrerUserId: string | null = null;

    if (referrerId) {
      const [profile] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(and(eq(profiles.slug, String(referrerId)), eq(profiles.role, referrerType)))
        .limit(1);
      if (!profile) return NextResponse.json({ error: `${referrerType} not found` }, { status: 404 });
      if (session.role !== "admin" && profile.userId !== session.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      resolvedReferrerUserId = profile.userId;
    } else {
      const [profile] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(and(eq(profiles.userId, session.id), eq(profiles.role, referrerType)))
        .limit(1);
      if (!profile) return NextResponse.json({ error: `${referrerType} profile not found` }, { status: 404 });
      resolvedReferrerUserId = profile.userId;
    }

    if (!resolvedReferrerUserId) {
      return NextResponse.json({ error: "Could not resolve referrer" }, { status: 400 });
    }

    const clicks = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(and(eq(referrals.referrerType, referrerType), eq(referrals.referrerUserId, resolvedReferrerUserId)))
      .then((r) => Number(r[0]?.count || 0));

    const registrations = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(and(eq(referrals.referrerType, referrerType), eq(referrals.referrerUserId, resolvedReferrerUserId), eq(referrals.status, "registered")))
      .then((r) => Number(r[0]?.count || 0));

    const bookings = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(and(eq(referrals.referrerType, referrerType), eq(referrals.referrerUserId, resolvedReferrerUserId), eq(referrals.status, "booked")))
      .then((r) => Number(r[0]?.count || 0));

    const rewarded = await db
      .select({ count: sql<number>`count(*)::int`, points: sql<number>`coalesce(sum(points_awarded), 0)::int` })
      .from(referrals)
      .where(and(eq(referrals.referrerType, referrerType), eq(referrals.referrerUserId, resolvedReferrerUserId), eq(referrals.status, "rewarded")))
      .then((r) => ({ count: Number(r[0]?.count || 0), points: Number(r[0]?.points || 0) }));

    const recent = await db
      .select({
        id: referrals.id,
        status: referrals.status,
        referredEmail: referrals.referredEmail,
        pointsAwarded: referrals.pointsAwarded,
        clickedAt: referrals.clickedAt,
        bookedAt: referrals.bookedAt,
        rewardedAt: referrals.rewardedAt,
      })
      .from(referrals)
      .where(and(eq(referrals.referrerType, referrerType), eq(referrals.referrerUserId, resolvedReferrerUserId)))
      .orderBy(desc(referrals.clickedAt))
      .limit(20);

    return NextResponse.json({
      clicks,
      registrations,
      bookings,
      rewarded: rewarded.count,
      pointsEarned: rewarded.points,
      recent,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
