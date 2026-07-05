import Link from "next/link";
import { ArrowRight, Star, MapPin, Clock, BadgeCheck } from "lucide-react";
import { featuredArtists } from "@/lib/data";

export function FeaturedArtistsSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-rose-50/30 dark:from-neutral-950 dark:to-neutral-900" id="featured">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-sm font-semibold text-rose-500 uppercase tracking-wider mb-2">
              Top Talent
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white">
              Featured Artists
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Malaysia&apos;s most talented makeup artists
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredArtists.map((artist, i) => (
            <div
              key={artist.id}
              className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 hover:border-rose-200 dark:hover:border-rose-800 shadow-sm hover:shadow-xl hover:shadow-rose-100/50 dark:hover:shadow-rose-900/10 transition-all duration-300 relative"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Link href={`/artists/${artist.slug}`}>
                <div className="relative aspect-[4/5] overflow-hidden">
                  {artist.demo && (
                    <div className="absolute top-0 left-0 z-10 px-3 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-br-xl shadow-sm">
                      Sample Profile
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Rating badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-full shadow-sm">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {artist.rating}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      ({artist.reviewCount})
                    </span>
                  </div>

                  {/* Verified badge */}
                  {artist.verified && (
                    <div className="absolute top-4 left-4 flex items-center gap-1 px-2.5 py-1 bg-blue-500/90 backdrop-blur-sm rounded-full">
                      <BadgeCheck className="w-3.5 h-3.5 text-white" />
                      <span className="text-[10px] font-semibold text-white">Verified</span>
                    </div>
                  )}

                  {/* Name & location overlay */}
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
              </Link>

              <Link href={`/artists/${artist.slug}`}>
                <div className="p-5">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {[...new Set(artist.categories)].slice(0, 3).map((cat, j) => (
                      <span
                        key={`${cat}-${j}`}
                        className="px-2.5 py-0.5 text-[11px] font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full capitalize"
                      >
                        {cat.replace(/-/g, " ")}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400">from </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        MYR {artist.price}
                      </span>
                      <span className="text-xs text-gray-400">/hr</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
                      View Profile{" "}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/artists"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-100"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
