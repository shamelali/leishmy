import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { artists } from "@/db/schema";
import { ilike, or } from "drizzle-orm";
import { featuredArtists, categories } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const query = db.select().from(artists).limit(limit);

    if (search) {
      query.where(
        or(
          ilike(artists.name, `%${search}%`),
          ilike(artists.location, `%${search}%`),
          ilike(artists.bio, `%${search}%`),
        ),
      );
    }

    const rows = await query;

    if (rows.length === 0) {
      let fallback = featuredArtists;
      if (search) {
        fallback = featuredArtists.filter(
          (a) =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.location.toLowerCase().includes(search.toLowerCase()),
        );
      }
      if (category) {
        fallback = fallback.filter((a) =>
          a.categories.includes(category),
        );
      }

      return NextResponse.json({
        artists: fallback.slice(0, limit),
        categories,
      });
    }

    return NextResponse.json({ artists: rows, categories });
  } catch (error) {
    console.error("Fetch artists error:", error);
    return NextResponse.json(
      {
        artists: featuredArtists,
        categories,
      },
      { status: 200 },
    );
  }
}
