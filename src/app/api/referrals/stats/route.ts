import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { referrals, artists, studios } from "@/db/schema";
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

    let resolvedReferrerId: number | null = null;

    if (referrerId) {
      const idNum = Number(referrerId);
      if (referrerType === "artist") {
        const [artist] = await db
          .select({ id: artists.id, userId: artists.userId })
          .from(artists)
          .where(eq(artists.id, idNum))
          .limit(1);
        if (!artist) return NextResponse.json({ error: "Artist not found" }, { status: 404 });
        if (session.role !== "admin" && artist.userId !== session.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        resolvedReferrerId = artist.id;
      } else {
        const [studio] = await db
          .select({ id: studios.id, userId: studios.userId })
          .from(studios)
          .where(eq(studios.id, idNum))
          .limit(1);
        if (!studio) return NextResponse.json({ error: "Studio not found" }, { status: 404 });
        if (session.role !== "admin" && studio.userId !== session.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        resolvedReferrerId = studio.id;
      }
    } else {
      if (referrerType === "artist") {
        const [artist] = await db
          .select({ id: artists.id })
          .from(artists)
          .where(eq(artists.userId, session.id))
          .limit(1);
        if (!artist) return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });
        resolvedReferrerId = artist.id;
      } else {
        const [studio] = await db
          .select({ id: studios.id })
          .from(studios)
          .where(eq(studios.userId, session.id))
          .limit(1);
        if (!studio) return NextResponse.json({ error: "Studio profile not found" }, { status: 404 });
        resolvedReferrerId = studio.id;
      }
    }

    if (!resolvedReferrerId) {
      return NextResponse.json({ error: "Could not resolve referrer" }, { status: 400 });
    }

    const clicks = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(and(eq(referrals.referrerType, referrerType), eq(referrals.referrerId, resolvedReferrerId)))
      .then((r) => Number(r[0]?.count || 0));

    const registrations = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(and(eq(referrals.referrerType, referrerType), eq(referrals.referrerId, resolvedReferrerId), eq(referrals.status, "registered")))
      .then((r) => Number(r[0]?.count || 0));

    const bookings = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(and(eq(referrals.referrerType, referrerType), eq(referrals.referrerId, resolvedReferrerId), eq(referrals.status, "booked")))
      .then((r) => Number(r[0]?.count || 0));

    const rewarded = await db
      .select({ count: sql<number>`count(*)::int`, points: sql<number>`coalesce(sum(points_awarded), 0)::int` })
      .from(referrals)
      .where(and(eq(referrals.referrerType, referrerType), eq(referrals.referrerId, resolvedReferrerId), eq(referrals.status, "rewarded")))
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
      .where(and(eq(referrals.referrerType, referrerType), eq(referrals.referrerId, resolvedReferrerId)))
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
