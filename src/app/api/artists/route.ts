import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { artists, artistCategories, categories as categoriesTable } from "@/db/schema";
import { ilike, or, eq, inArray, and, gte, lte, desc, asc, sql, count, notLike } from "drizzle-orm";
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
    const pageSize = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const offset = (page - 1) * pageSize;

    let rows: typeof artists.$inferSelect[] = [];
    let total = 0;

    const baseFilters: any[] = [notLike(artists.userId, "artist-seed%")];

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

        total = matchingArtistIds.length;

        if (matchingArtistIds.length > 0) {
          const ids = matchingArtistIds.map((r) => r.artistId);
          const catFilters = [inArray(artists.id, ids), ...baseFilters];
          rows = await db
            .select()
            .from(artists)
            .where(and(...catFilters))
            .orderBy(orderBy)
            .limit(pageSize)
            .offset(offset);
        }
      }
    } else {
      let query = db.select().from(artists);
      let countQuery = db.select({ count: count() }).from(artists);

      if (baseFilters.length > 0) {
        const where = and(...baseFilters);
        query.where(where);
        countQuery.where(where);
      }

      const [totalResult] = await countQuery;
      total = totalResult?.count ?? 0;

      rows = await query.orderBy(orderBy).limit(pageSize).offset(offset);
    }

    return NextResponse.json({
      artists: rows,
      categories,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    });
  } catch (error) {
    console.error("Fetch artists error:", error);
    return NextResponse.json({ error: "Failed to fetch artists" }, { status: 500 });
  }
}
