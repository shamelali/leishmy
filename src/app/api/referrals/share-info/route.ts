import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { artists, studios, referrals } from "@/db/schema";
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
    const role = searchParams.get("role") || "artist";

    if (role !== "artist" && role !== "studio") {
      return NextResponse.json({ error: "role must be 'artist' or 'studio'" }, { status: 400 });
    }

    let profile: { id: number; slug: string; name: string };

    if (role === "artist") {
      const [artist] = await db
        .select({ id: artists.id, slug: artists.slug, name: artists.name })
        .from(artists)
        .where(eq(artists.userId, session.id))
        .limit(1);
      if (!artist || !artist.slug) {
        return NextResponse.json({ error: "Artist profile not found" }, { status: 404 });
      }
      profile = artist;
    } else {
      const [studio] = await db
        .select({ id: studios.id, slug: studios.slug, name: studios.name })
        .from(studios)
        .where(eq(studios.userId, session.id))
        .limit(1);
      if (!studio || !studio.slug) {
        return NextResponse.json({ error: "Studio profile not found" }, { status: 404 });
      }
      profile = studio;
    }

    const shareLink = `${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/r/${profile.slug}`;

    const [clickResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(and(eq(referrals.referrerType, role), eq(referrals.referrerId, profile.id)))
      .then((r) => [{ count: Number(r[0]?.count || 0) }]);

    const [rewardResult] = await db
      .select({
        count: sql<number>`count(*)::int`,
        points: sql<number>`coalesce(sum(points_awarded), 0)::int`,
      })
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerType, role),
          eq(referrals.referrerId, profile.id),
          eq(referrals.status, "rewarded"),
        ),
      )
      .then((r) => [{ count: Number(r[0]?.count || 0), points: Number(r[0]?.points || 0) }]);

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
      .where(and(eq(referrals.referrerType, role), eq(referrals.referrerId, profile.id)))
      .orderBy(desc(referrals.clickedAt))
      .limit(10);

    return NextResponse.json({
      profile: { name: profile.name, slug: profile.slug, type: role },
      shareLink,
      stats: {
        clicks: clickResult.count,
        referrals: rewardResult.count,
        pointsEarned: rewardResult.points,
      },
      recent,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
