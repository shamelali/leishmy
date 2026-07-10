"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Star, MapPin, Trash2, ChevronDown } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";
import ImageWithFallback from "@/components/ImageWithFallback";
import Skeleton from "@/components/Skeleton";

const PER_PAGE = 6;

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [allArtists, setAllArtists] = useState<any[]>([]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (favorites.length === 0) {
      setAllArtists([]);
      setArtists([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/artists`)
      .then((r) => r.json())
      .then((data) => {
        const favArtists = (data.artists || []).filter((a: any) =>
          favorites.includes(String(a.id)),
        );
        setAllArtists(favArtists);
        setArtists(favArtists.slice(0, PER_PAGE));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [favorites]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setArtists(allArtists.slice(0, page * PER_PAGE));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [page, allArtists]);

  const totalPages = Math.ceil(allArtists.length / PER_PAGE);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6 text-rose-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Favorites
          </h1>
          <span className="px-3 py-1 text-sm font-medium bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full">
            {favorites.length}
          </span>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800"
              >
                <Skeleton className="aspect-[4/5]" />
              </div>
            ))}
          </div>
        ) : allArtists.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-gray-200 dark:text-neutral-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No favorites yet
            </h2>
            <p className="text-gray-400 mb-6">
              Start browsing and save artists you love!
            </p>
            <Link
              href="/artists"
              className="inline-flex px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all"
            >
              Browse Artists
            </Link>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artists.map((artist: any) => (
                <div
                  key={artist.id}
                  className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 hover:border-rose-200 dark:hover:border-rose-800 shadow-sm transition-all"
                >
                  <Link href={`/artists/${artist.slug || artist.id}`}>
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
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white">
                          {artist.name}
                        </h3>
                        <div className="flex items-center gap-1 text-white/70 text-sm mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{artist.location}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="p-4">
                    <button
                      onClick={() => removeFavorite(String(artist.id))}
                      className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {page < totalPages && (
              <div className="flex justify-center py-8">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-white dark:bg-neutral-900 border-2 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 dark:hover:border-rose-700 transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
