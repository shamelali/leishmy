import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, users, services, categories } from "@/db/schema";
import { eq, and, or, like, sql, desc, asc, gte, lte, count } from "drizzle-orm";

export const runtime = "nodejs";

type SearchResult = {
  id: string;
  type: "artist" | "studio" | "service";
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  rating: number;
  reviewCount: number;
  categories: string[];
  area: string | null;
  avatar: string | null;
  image: string | null;
};

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get("q")?.trim() || "";
  const type = (sp.get("type") || "all") as "all" | "artist" | "studio" | "service";
  const category = sp.get("category") || "";
  const location = sp.get("location") || "";
  const minPrice = sp.get("minPrice") ? Number(sp.get("minPrice")) : undefined;
  const maxPrice = sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined;
  const sort = sp.get("sort") || "rating";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));
  const offset = (page - 1) * limit;

  try {
    const results: SearchResult[] = [];
    let total = 0;

    const searchArtist = type === "all" || type === "artist";
    const searchStudio = type === "all" || type === "studio";
    const searchService = type === "all" || type === "service";

    // Build search conditions
    const likeCondition = q
      ? or(
          like(profiles.bio, `%${q}%`),
          like(profiles.description, `%${q}%`),
          like(users.name, `%${q}%`),
          sql`EXISTS (SELECT 1 FROM unnest(${profiles.categories}) AS cat WHERE cat ILIKE ${`%${q}%`})`,
        )
      : undefined;

    const locationCondition = location
      ? or(
          eq(profiles.area, location),
          eq(profiles.district, location),
        )
      : undefined;

    // Search artists
    if (searchArtist) {
      const conditions = [
        eq(profiles.role, "artist"),
        sql`${users.id} NOT LIKE 'artist-seed%'`,
        likeCondition,
        locationCondition,
        minPrice !== undefined ? gte(profiles.price, String(minPrice)) : undefined,
        maxPrice !== undefined ? lte(profiles.price, String(maxPrice)) : undefined,
      ].filter(Boolean);

      const [countRow] = await db
        .select({ total: count() })
        .from(profiles)
        .innerJoin(users, eq(profiles.userId, users.id))
        .where(and(...conditions));

      const sortColumn =
        sort === "price_asc" ? asc(profiles.price)
        : sort === "price_desc" ? desc(profiles.price)
        : sort === "newest" ? desc(profiles.createdAt)
        : desc(profiles.rating);

      const rows = await db
        .select({
          id: profiles.userId,
          name: users.name,
          slug: profiles.slug,
          description: profiles.description,
          price: profiles.price,
          rating: profiles.rating,
          reviewCount: profiles.reviewCount,
          categories: profiles.categories,
          area: profiles.area,
          avatar: users.avatar,
        })
        .from(profiles)
        .innerJoin(users, eq(profiles.userId, users.id))
        .where(and(...conditions))
        .orderBy(sortColumn)
        .limit(limit)
        .offset(offset);

      total += countRow?.total ?? 0;
      for (const r of rows) {
        results.push({
          id: r.id,
          type: "artist",
          name: r.name || "Artist",
          slug: r.slug,
          description: r.description,
          price: Number(r.price) || 0,
          rating: Number(r.rating) || 0,
          reviewCount: r.reviewCount || 0,
          categories: r.categories || [],
          area: r.area,
          avatar: r.avatar,
          image: null,
        });
      }
    }

    // Search studios
    if (searchStudio) {
      const conditions = [
        eq(profiles.role, "studio"),
        sql`${users.id} NOT LIKE 'studio-seed%'`,
        likeCondition,
        locationCondition,
        minPrice !== undefined ? gte(profiles.price, String(minPrice)) : undefined,
        maxPrice !== undefined ? lte(profiles.price, String(maxPrice)) : undefined,
      ].filter(Boolean);

      const [countRow] = await db
        .select({ total: count() })
        .from(profiles)
        .innerJoin(users, eq(profiles.userId, users.id))
        .where(and(...conditions));

      const sortColumn =
        sort === "price_asc" ? asc(profiles.price)
        : sort === "price_desc" ? desc(profiles.price)
        : sort === "newest" ? desc(profiles.createdAt)
        : desc(profiles.rating);

      const rows = await db
        .select({
          id: profiles.userId,
          name: users.name,
          slug: profiles.slug,
          description: profiles.description,
          price: profiles.price,
          rating: profiles.rating,
          reviewCount: profiles.reviewCount,
          categories: profiles.categories,
          area: profiles.area,
          avatar: users.avatar,
        })
        .from(profiles)
        .innerJoin(users, eq(profiles.userId, users.id))
        .where(and(...conditions))
        .orderBy(sortColumn)
        .limit(limit)
        .offset(offset);

      total += countRow?.total ?? 0;
      for (const r of rows) {
        results.push({
          id: r.id,
          type: "studio",
          name: r.name || "Studio",
          slug: r.slug,
          description: r.description,
          price: Number(r.price) || 0,
          rating: Number(r.rating) || 0,
          reviewCount: r.reviewCount || 0,
          categories: r.categories || [],
          area: r.area,
          avatar: r.avatar,
          image: null,
        });
      }
    }

    // Search services
    if (searchService) {
      const serviceConditions = [
        q
          ? or(
              like(services.name, `%${q}%`),
              like(services.description, `%${q}%`),
            )
          : undefined,
        category ? eq(services.category, category) : undefined,
        minPrice !== undefined ? gte(services.price, String(minPrice)) : undefined,
        maxPrice !== undefined ? lte(services.price, String(maxPrice)) : undefined,
      ].filter(Boolean);

      const [countRow] = await db
        .select({ total: count() })
        .from(services)
        .where(and(...serviceConditions));

      const rows = await db
        .select({
          id: services.id,
          name: services.name,
          description: services.description,
          price: services.price,
          category: services.category,
          artistId: services.artistId,
          studioId: services.studioId,
        })
        .from(services)
        .where(and(...serviceConditions))
        .orderBy(desc(services.price))
        .limit(limit)
        .offset(offset);

      total += countRow?.total ?? 0;
      for (const r of rows) {
        const providerId = r.artistId || r.studioId;
        let providerName = "";
        if (providerId) {
          const [provider] = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, providerId))
            .limit(1);
          providerName = provider?.name || "";
        }
        results.push({
          id: String(r.id),
          type: "service",
          name: r.name,
          slug: null,
          description: r.description,
          price: Number(r.price) || 0,
          rating: 0,
          reviewCount: 0,
          categories: r.category ? [r.category] : [],
          area: null,
          avatar: null,
          image: null,
        });
      }
    }

    // Get categories for filters
    const allCategories = await db
      .select({ name: categories.name, slug: categories.slug })
      .from(categories);

    return NextResponse.json({
      results,
      categories: allCategories,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
