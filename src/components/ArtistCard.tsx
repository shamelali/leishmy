"use client";

import Link from "next/link";
import {
  Star,
  MapPin,
  ArrowRight,
  BadgeCheck,
  Clock,
  Heart,
} from "lucide-react";
import type { Artist } from "@/lib/data";
import ImageWithFallback from "@/components/ImageWithFallback";
import { useFavorites } from "@/context/FavoritesContext";

export default function ArtistCard({ artist }: { artist: Artist }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(artist.id);

  return (
    <div className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 hover:border-rose-200 dark:hover:border-rose-800 shadow-sm hover:shadow-xl hover:shadow-rose-100/50 dark:hover:shadow-rose-900/10 transition-all duration-300 relative">
      <Link href={`/artists/${artist.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden">
          <ImageWithFallback
            src={artist.image}
            alt={artist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-full shadow-sm">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {artist.rating}
            </span>
            <span className="text-[10px] text-gray-400">
              ({artist.reviewCount})
            </span>
          </div>
          {artist.verified && (
            <div className="absolute top-4 left-4 flex items-center gap-1 px-2.5 py-1 bg-blue-500/90 backdrop-blur-sm rounded-full">
              <BadgeCheck className="w-3.5 h-3.5 text-white" />
              <span className="text-[10px] font-semibold text-white">
                Verified
              </span>
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
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(artist.id);
        }}
        className={`absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md ${
          liked
            ? "bg-rose-500 text-white shadow-rose-200 dark:shadow-rose-900/40"
            : "bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100"
        } ${artist.verified ? "top-14" : ""}`}
        aria-label={liked ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart className={`w-4 h-4 ${liked ? "fill-white" : ""}`} />
      </button>

      <Link href={`/artists/${artist.slug}`} className="block">
        <div className="p-5">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[...new Set(artist.categories)].slice(0, 3).map((cat, ci) => (
              <span
                key={`${cat}-${ci}`}
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
  );
}
