import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { artists, artistCategories, categories as categoriesTable } from "@/db/schema";
import { ilike, or, eq, inArray, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { categories } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "rating";
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    let rows: typeof artists.$inferSelect[] = [];

    const baseFilters = [];

    if (search) {
      baseFilters.push(
        or(
          ilike(artists.name, `%${search}%`),
          ilike(artists.location, `%${search}%`),
          ilike(artists.bio, `%${search}%`),
        ),
      );
    }

    if (location) {
      baseFilters.push(
        or(
          ilike(artists.location, `%${location}%`),
          ilike(artists.area, `%${location}%`),
          ilike(artists.district, `%${location}%`),
        ),
      );
    }

    if (minPrice) {
      baseFilters.push(gte(artists.price, String(minPrice)));
    }

    if (maxPrice) {
      baseFilters.push(lte(artists.price, String(maxPrice)));
    }

    const sortMap: Record<string, any> = {
      rating: desc(artists.rating),
      price_asc: asc(artists.price),
      price_desc: desc(artists.price),
      name: asc(artists.name),
      newest: desc(artists.createdAt),
    };

    const orderBy = sortMap[sort] || desc(artists.rating);

    if (category) {
      const categoryRow = await db
        .select({ id: categoriesTable.id })
        .from(categoriesTable)
        .where(eq(categoriesTable.slug, category))
        .limit(1);

      if (categoryRow.length > 0) {
        const matchingArtistIds = await db
          .select({ artistId: artistCategories.artistId })
          .from(artistCategories)
          .where(eq(artistCategories.categoryId, categoryRow[0].id));

        if (matchingArtistIds.length > 0) {
          const ids = matchingArtistIds.map((r) => r.artistId);
          const catFilters = [inArray(artists.id, ids), ...baseFilters];
          rows = await db
            .select()
            .from(artists)
            .where(and(...catFilters))
            .orderBy(orderBy)
            .limit(limit);
        }
      }
    } else {
      const query = db.select().from(artists);

      if (baseFilters.length > 0) {
        query.where(and(...baseFilters));
      }

      query.orderBy(orderBy).limit(limit);
      rows = await query;
    }

    return NextResponse.json({ artists: rows, categories });
  } catch (error) {
    console.error("Fetch artists error:", error);
    return NextResponse.json({ error: "Failed to fetch artists" }, { status: 500 });
  }
}
