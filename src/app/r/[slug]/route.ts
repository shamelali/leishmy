import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, referrals } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug || slug.length > 200) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const cleanSlug = slug.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
  if (cleanSlug.length === 0) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const [artist] = await db
    .select({ userId: profiles.userId, slug: profiles.slug })
    .from(profiles)
    .where(and(eq(profiles.slug, cleanSlug), eq(profiles.role, "artist")))
    .limit(1);

  if (artist) {
    db.insert(referrals).values({
      referrerType: "artist",
      referrerUserId: artist.userId,
      status: "clicked",
    }).catch(() => {});

    const response = NextResponse.redirect(
      new URL(`/artists/${artist.slug}`, _request.url),
      301,
    );

    response.cookies.set("leish_ref", JSON.stringify({ t: "artist", id: artist.slug }), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  }

  const [studio] = await db
    .select({ userId: profiles.userId, slug: profiles.slug })
    .from(profiles)
    .where(and(eq(profiles.slug, cleanSlug), eq(profiles.role, "studio")))
    .limit(1);

  if (studio) {
    db.insert(referrals).values({
      referrerType: "studio",
      referrerUserId: studio.userId,
      status: "clicked",
    }).catch(() => {});

    const response = NextResponse.redirect(
      new URL(`/studios/${studio.slug}`, _request.url),
      301,
    );

    response.cookies.set("leish_ref", JSON.stringify({ t: "studio", id: studio.slug }), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
