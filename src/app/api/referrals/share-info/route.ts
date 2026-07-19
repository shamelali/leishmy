import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, users, referrals } from "@/db/schema";
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

    let profile: { userId: string; slug: string | null; name: string | null };

    const [p] = await db
      .select({ userId: profiles.userId, slug: profiles.slug, name: users.name })
      .from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId))
      .where(and(eq(profiles.userId, session.id), eq(profiles.role, role)))
      .limit(1);

    if (!p || !p.slug) {
      return NextResponse.json({ error: `${role} profile not found` }, { status: 404 });
    }
    profile = p;

    const shareLink = `${process.env.NEXT_PUBLIC_URL || "https://leish.my"}/r/${profile.slug}`;

    const [clickResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(and(eq(referrals.referrerType, role), eq(referrals.referrerUserId, profile.userId)))
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
          eq(referrals.referrerUserId, profile.userId),
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
      .where(and(eq(referrals.referrerType, role), eq(referrals.referrerUserId, profile.userId)))
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
