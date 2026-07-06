import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { limit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = await limit(`review:${ip}`);
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { artistId, studioId, author, rating, text, service, userId } = body;

    if (userId && userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!author || !rating) {
      return NextResponse.json(
        { error: "author and rating are required" },
        { status: 400 },
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    const [review] = await db
      .insert(reviews)
      .values({
        author,
        rating,
        text: text || null,
        service: service || null,
        artistId: artistId || null,
        studioId: studioId || null,
        userId: userId || null,
      })
      .returning();

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Review error:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");
    const studioId = searchParams.get("studioId");

    const query = db.select().from(reviews);

    if (artistId) {
      const id = Number(artistId);
      if (!isNaN(id)) query.where(eq(reviews.artistId, id));
    }
    if (studioId) {
      const id = Number(studioId);
      if (!isNaN(id)) query.where(eq(reviews.studioId, id));
    }

    const rows = await query;
    return NextResponse.json({ reviews: rows });
  } catch (error) {
    console.error("Fetch reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
