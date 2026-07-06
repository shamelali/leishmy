import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { artists, artistCategories, categories as categoriesTable } from "@/db/schema";
import { ilike, or, eq, inArray } from "drizzle-orm";
import { categories } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    let rows: typeof artists.$inferSelect[] = [];

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
          rows = await db
            .select()
            .from(artists)
            .where(inArray(artists.id, ids))
            .limit(limit);

          if (search) {
            rows = rows.filter(
              (a) =>
                a.name?.toLowerCase().includes(search.toLowerCase()) ||
                a.location?.toLowerCase().includes(search.toLowerCase()) ||
                a.bio?.toLowerCase().includes(search.toLowerCase()),
            );
          }
        } else {
          rows = [];
        }
      } else {
        rows = [];
      }
    } else {
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

      rows = await query;
    }

    return NextResponse.json({ artists: rows, categories });
  } catch (error) {
    console.error("Fetch artists error:", error);
    return NextResponse.json({ error: "Failed to fetch artists" }, { status: 500 });
  }
}
