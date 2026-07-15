import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { referrals, artists, studios, users } from "@/db/schema";
import { getAuthSession } from "@/lib/auth/server";
import { awardPoints } from "@/lib/loyalty";
import { eq, and, inArray } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, referrerType, referrerId } = body;

    if (!bookingId || !referrerType || !referrerId) {
      return NextResponse.json({ error: "bookingId, referrerType, and referrerId are required" }, { status: 400 });
    }

    if (referrerType !== "artist" && referrerType !== "studio") {
      return NextResponse.json({ error: "referrerType must be 'artist' or 'studio'" }, { status: 400 });
    }

    const referrerIdNum = Number(referrerId);
    if (!Number.isFinite(referrerIdNum) || referrerIdNum <= 0) {
      return NextResponse.json({ error: "Invalid referrerId" }, { status: 400 });
    }

    const referrerUserId = referrerType === "artist"
      ? await db
          .select({ userId: artists.userId })
          .from(artists)
          .where(eq(artists.id, referrerIdNum))
          .limit(1)
          .then((r) => r[0]?.userId)
      : await db
          .select({ userId: studios.userId })
          .from(studios)
          .where(eq(studios.id, referrerIdNum))
          .limit(1)
          .then((r) => r[0]?.userId);

    if (!referrerUserId) {
      return NextResponse.json({ error: "Referrer not found" }, { status: 404 });
    }

    if (referrerUserId === session.id) {
      return NextResponse.json({ error: "Cannot refer yourself" }, { status: 422 });
    }

    const existing = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerType, referrerType),
          eq(referrals.referrerId, referrerIdNum),
          eq(referrals.referredUserId, session.id),
          inArray(referrals.status, ["registered", "booked", "rewarded"]),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].status === "rewarded") {
        return NextResponse.json({ error: "Already rewarded" }, { status: 422 });
      }
      if (existing[0].status === "booked" && existing[0].bookingId) {
        return NextResponse.json({ error: "Already attributed to a booking" }, { status: 422 });
      }
    }

    await db
      .update(referrals)
      .set({
        referredUserId: session.id,
        referredEmail: session.email,
        bookingId: Number(bookingId),
        status: "booked",
        bookedAt: new Date(),
      })
      .where(
        and(
          eq(referrals.referrerType, referrerType),
          eq(referrals.referrerId, referrerIdNum),
          eq(referrals.referredUserId, session.id),
          inArray(referrals.status, ["clicked", "registered"]),
        ),
      );

    const pointsAwarded = await awardPoints(
      referrerUserId,
      "referral",
      String(bookingId),
      `Referral booking #${bookingId}`,
    );

    if (pointsAwarded) {
      await db
        .update(referrals)
        .set({
          status: "rewarded",
          pointsAwarded,
          rewardedAt: new Date(),
        })
        .where(
          and(
            eq(referrals.referrerType, referrerType),
            eq(referrals.referrerId, referrerIdNum),
            eq(referrals.referredUserId, session.id),
          ),
        );
    }

    return NextResponse.json({ success: true, pointsAwarded });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
