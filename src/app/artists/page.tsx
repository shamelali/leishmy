import Link from "next/link";
import { Star, MapPin, Clock, BadgeCheck, ArrowRight, Search } from "lucide-react";
import { db } from "@/db";
import { artists, artistCategories, categories as categoriesTable } from "@/db/schema";
import { eq, inArray, and, notLike } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("artistsTitle"),
    description: t("artistsDescription"),
  };
}

export default async function ArtistsPage({ searchParams }: Props) {
  const { category } = await searchParams;

  const dbCategories = await db
    .select({ slug: categoriesTable.slug, name: categoriesTable.name, icon: categoriesTable.icon })
    .from(categoriesTable)
    .orderBy(categoriesTable.name);
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
    let query;

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
          query = db
            .select()
            .from(artists)
            .where(and(
              inArray(artists.id, matchingArtistIds.map((r) => r.artistId)),
              notLike(artists.userId, "artist-seed%"),
            ))
            .limit(50);
        } else {
          displayArtists = [];
        }
      } else {
        displayArtists = [];
      }
    } else {
      query = db
        .select()
        .from(artists)
        .where(notLike(artists.userId, "artist-seed%"))
        .limit(50);
    }

    if (!displayArtists && query) {
      const rows = await query;
      if (rows.length > 0) {
        const artistIds = rows.map((a) => a.id);

        const categoryLinks = await db
          .select({
            artistId: artistCategories.artistId,
            categoryName: categoriesTable.name,
          })
          .from(artistCategories)
          .innerJoin(categoriesTable, eq(artistCategories.categoryId, categoriesTable.id))
          .where(inArray(artistCategories.artistId, artistIds));

        const categoriesByArtist = new Map<number, string[]>();
        for (const link of categoryLinks) {
          const list = categoriesByArtist.get(link.artistId) || [];
          list.push(link.categoryName);
          categoriesByArtist.set(link.artistId, list);
        }

        displayArtists = rows.map((a) => ({
          id: String(a.id),
          name: a.name,
          slug: a.slug,
          image: a.image || "/placeholder.svg",
          location: a.location || "",
          rating: Number(a.rating) || 0,
          reviewCount: a.reviewCount || 0,
          price: Number(a.price) || 0,
          verified: a.verified || false,
          responseTime: a.responseTime || "",
          categories: categoriesByArtist.get(a.id) || [],
          specialties: [] as string[],
          languages: (a.languages || []) as string[],
          bio: a.bio || "",
          portfolio: (a.portfolio || []) as string[],
          featured: false,
        }));
      }
    }
  } catch {
    console.error("Failed to fetch artists");
  }
  if (!displayArtists) displayArtists = [];

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

          <div className="mt-6 max-w-xl">
            <div className="flex items-center gap-3 px-5 py-3.5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm">
              <Search className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400 text-sm">Search artists, styles, locations...</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            <Link
              href="/artists"
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                !category
                  ? "bg-rose-500 text-white"
                  : "bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 hover:border-rose-300 dark:hover:border-rose-700"
              }`}
            >
              All
            </Link>
            {dbCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/artists?category=${cat.slug}`}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                  category === cat.slug
                    ? "bg-rose-500 text-white"
                    : "bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 hover:border-rose-300 dark:hover:border-rose-700"
                }`}
              >
                {cat.icon} {cat.name}
              </Link>
            ))}
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
