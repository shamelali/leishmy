import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthSession } from "@/lib/auth/server";
import { limit } from "@/lib/rate-limit";
import { createReviewSchema } from "@/lib/validations/reviews";

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
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { artistId, studioId, author, rating, text, service, userId } = parsed.data;

    if (userId && userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      query.where(eq(reviews.artistId, artistId));
    }
    if (studioId) {
      query.where(eq(reviews.studioId, studioId));
    }

    const rows = await query;
    return NextResponse.json({ reviews: rows });
  } catch (error) {
    console.error("Fetch reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
