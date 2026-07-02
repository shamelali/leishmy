import Link from "next/link";
import { Star, MapPin, Users, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { studios } from "@/db/schema";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Studios — Leish!",
  description: "Discover premium beauty studios across Malaysia.",
};

async function getStudios() {
  try {
    const rows = await db.select().from(studios).limit(50);
    if (rows.length > 0) {
      return rows.map((s) => ({
        id: String(s.id),
        name: s.name,
        slug: s.slug || String(s.id),
        image: s.image || "/placeholder.svg",
        location: s.location || "",
        rating: Number(s.rating) || 0,
        reviewCount: s.reviewCount || 0,
        priceRange: s.price ? `MYR ${s.price}` : "Contact for price",
        description: s.description || "",
        amenities: [] as string[],
        artistCount: 0,
        featured: s.featured || false,
      }));
    }
  } catch {
    // fall through
  }
  return [];
}

export default async function StudiosPage() {
  const displayStudios = await getStudios();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Header */}
      <section className="bg-gradient-to-br from-rose-50 via-pink-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white">
            Browse Studios
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
            Discover premium beauty studios across Malaysia.
          </p>
        </div>
      </section>

      {/* Studios Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayStudios.map((studio) => (
              <Link
                key={studio.id}
                href={`/studios/${studio.slug}`}
                className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 hover:border-rose-200 dark:hover:border-rose-800 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative aspect-[2/1] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={studio.image}
                    alt={studio.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-xl font-bold text-white">{studio.name}</h3>
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-full shadow-sm">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{studio.rating}</span>
                    <span className="text-[10px] text-gray-400">({studio.reviewCount})</span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {studio.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {studio.artistCount} artists
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                    {studio.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {studio.priceRange}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 dark:text-rose-400">
                      View Details <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {studio.amenities.slice(0, 3).map((a) => (
                      <span
                        key={a}
                        className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 rounded-full"
                      >
                        {a}
                      </span>
                    ))}
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
