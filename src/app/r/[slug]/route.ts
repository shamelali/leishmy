import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { artists, studios, referrals } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    .select({ id: artists.id, slug: artists.slug })
    .from(artists)
    .where(eq(artists.slug, cleanSlug))
    .limit(1);

  if (artist) {
    db.insert(referrals).values({
      referrerType: "artist",
      referrerId: artist.id,
      status: "clicked",
    }).catch(() => {});

    const response = NextResponse.redirect(
      new URL(`/artists/${artist.slug}`, _request.url),
      301,
    );

    response.cookies.set("leish_ref", JSON.stringify({ t: "artist", id: artist.id }), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  }

  const [studio] = await db
    .select({ id: studios.id, slug: studios.slug })
    .from(studios)
    .where(eq(studios.slug, cleanSlug))
    .limit(1);

  if (studio) {
    db.insert(referrals).values({
      referrerType: "studio",
      referrerId: studio.id,
      status: "clicked",
    }).catch(() => {});

    const response = NextResponse.redirect(
      new URL(`/studios/${studio.slug}`, _request.url),
      301,
    );

    response.cookies.set("leish_ref", JSON.stringify({ t: "studio", id: studio.id }), {
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
