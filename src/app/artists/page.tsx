import Link from "next/link";
import { Star, MapPin, Clock, BadgeCheck, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { profiles, users, bookings, categories as categoriesTable } from "@/db/schema";
import { eq, and, or, ilike, notLike, notInArray, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Metadata } from "next";
import ArtistSearchForm from "@/components/ArtistSearchForm";

type Props = {
  searchParams: Promise<{
    category?: string;
    search?: string;
    location?: string;
    state?: string;
    district?: string;
    eventCategory?: string;
    eventType?: string;
    eventTypeCustom?: string;
    date?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Browse Makeup Artists — Leish!",
  description: "Find and book Malaysia's top makeup artists. Filter by style, location, or budget.",
};

export default async function ArtistsPage({ searchParams }: Props) {
  const {
    category,
    search,
    location,
    state: stateParam,
    district: districtParam,
    eventCategory,
    eventType,
    date,
  } = await searchParams;

  type DisplayArtist = {
    id: string;
    name: string;
    slug?: string | null;
    image: string;
    location: string;
    rating: number;
    reviewCount: number;
    price: number;
    verified: boolean;
    responseTime: string;
    categories: string[];
    specialties: string[];
    languages: string[];
    bio: string;
    portfolio: string[];
    featured: boolean;
  };

  let displayArtists: DisplayArtist[] | undefined;
  try {
    const artistUsers = alias(users, "artist_users");
    const where = [eq(profiles.role, "artist"), notLike(profiles.userId, "artist-seed%")] as any[];

    if (category) {
      const categoryRow = await db
        .select({ slug: categoriesTable.slug })
        .from(categoriesTable)
        .where(eq(categoriesTable.slug, category))
        .limit(1);

      if (categoryRow.length > 0) {
        where.push(sql`${profiles.categories} @> ARRAY[${category}]::text[]`);
      } else {
        displayArtists = [];
      }
    }

    if (search || location) {
      const term = search || location || "";
      where.push(
        or(
          ilike(artistUsers.name, `%${term}%`),
          ilike(artistUsers.location, `%${term}%`),
          ilike(profiles.bio, `%${term}%`),
          ilike(profiles.area, `%${term}%`),
          ilike(profiles.district, `%${term}%`),
        ),
      );
    }

    if (stateParam) {
      where.push(
        or(
          ilike(profiles.area, `%${stateParam}%`),
          ilike(artistUsers.location, `%${stateParam}%`),
        ),
      );
    }

    if (districtParam) {
      where.push(
        or(
          ilike(profiles.district, `%${districtParam}%`),
          ilike(artistUsers.location, `%${districtParam}%`),
        ),
      );
    }

    if (eventCategory === "bridal") {
      where.push(sql`${profiles.categories} @> ARRAY['bridal']::text[]`);
    } else if (eventCategory === "non-bridal") {
      where.push(
        or(
          sql`${profiles.categories} @> ARRAY['event']::text[]`,
          sql`${profiles.categories} @> ARRAY['editorial']::text[]`,
        ),
      );
    }

    if (date) {
      const bookedRows = await db
        .select({ artistId: bookings.artistId })
        .from(bookings)
        .where(
          and(
            eq(bookings.date, new Date(date)),
            ne(bookings.status, "cancelled"),
            ne(bookings.status, "rejected"),
          ),
        );
      const bookedIds = bookedRows.map((r) => r.artistId).filter(Boolean) as string[];
      if (bookedIds.length > 0) {
        where.push(notInArray(profiles.userId, bookedIds));
      }
    }

    if (!displayArtists) {
      const rows = await db
        .select({
          id: profiles.userId,
          name: artistUsers.name,
          slug: profiles.slug,
          image: artistUsers.image,
          location: artistUsers.location,
          rating: profiles.rating,
          reviewCount: profiles.reviewCount,
          price: profiles.price,
          verified: profiles.verified,
          responseTime: profiles.responseTime,
          categories: profiles.categories,
          languages: profiles.languages,
          bio: profiles.bio,
          portfolio: profiles.portfolio,
        })
        .from(profiles)
        .innerJoin(artistUsers, eq(artistUsers.id, profiles.userId))
        .where(and(...where))
        .limit(50);

      displayArtists = rows.map((a) => ({
        id: a.id,
        name: a.name || "",
        slug: a.slug,
        image: a.image || "/placeholder.svg",
        location: a.location || "",
        rating: Number(a.rating) || 0,
        reviewCount: a.reviewCount || 0,
        price: Number(a.price) || 0,
        verified: a.verified || false,
        responseTime: a.responseTime || "",
        categories: (a.categories || []) as string[],
        specialties: [] as string[],
        languages: (a.languages || []) as string[],
        bio: a.bio || "",
        portfolio: (a.portfolio || []) as string[],
        featured: false,
      }));
    }
  } catch {
    console.error("Failed to fetch artists");
  }
  if (!displayArtists) displayArtists = [];

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (category && !("category" in overrides)) params.set("category", category);
    if (search) params.set("search", search);
    if (stateParam) params.set("state", stateParam);
    if (districtParam) params.set("district", districtParam);
    if (eventCategory) params.set("eventCategory", eventCategory);
    if (eventType) params.set("eventType", eventType);
    if (date) params.set("date", date);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    return qs ? `/artists?${qs}` : "/artists";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <section className="bg-gradient-to-br from-rose-50 via-pink-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-sm text-amber-700 dark:text-amber-300">
            We are currently onboarding selected makeup artists in KL and Selangor.
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white">
            Browse Makeup Artists
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
            Find and book Malaysia&apos;s top makeup artists for any occasion.
          </p>

          <div className="mt-6">
            <ArtistSearchForm
              initialSearch={search || ""}
              initialState={stateParam || ""}
              initialDistrict={districtParam || ""}
              initialEventCategory={eventCategory || ""}
              initialEventType={eventType || ""}
              initialEventTypeCustom=""
              initialDate={date || ""}
              currentCategory={category || ""}
            />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-white">{displayArtists.length}</span> artists
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayArtists.map((artist: any) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.slug || artist.id}`}
                className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 hover:border-rose-200 dark:hover:border-rose-800 shadow-sm hover:shadow-xl hover:shadow-rose-100/50 dark:hover:shadow-rose-900/10 transition-all duration-300"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-full shadow-sm">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{artist.rating}</span>
                    <span className="text-[10px] text-gray-400">({artist.reviewCount})</span>
                  </div>

                  {artist.verified && (
                    <div className="absolute top-4 left-4 flex items-center gap-1 px-2.5 py-1 bg-blue-500/90 backdrop-blur-sm rounded-full">
                      <BadgeCheck className="w-3.5 h-3.5 text-white" />
                      <span className="text-[10px] font-semibold text-white">Verified</span>
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white">{artist.name}</h3>
                    <div className="flex items-center gap-3 text-white/70 text-sm mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {artist.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {artist.responseTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(artist.categories || []).slice(0, 3).map((cat: string, j: number) => (
                      <span
                        key={`${cat}-${j}`}
                        className="px-2.5 py-0.5 text-[11px] font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full capitalize"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400">from </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">MYR {artist.price ?? artist.price}</span>
                      <span className="text-xs text-gray-400">/hr</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 dark:text-rose-400">
                      View Profile <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
