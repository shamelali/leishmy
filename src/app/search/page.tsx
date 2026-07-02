"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search as SearchIcon, MapPin, Star, BadgeCheck, ArrowRight, Sparkles } from "lucide-react";
import Skeleton from "@/components/Skeleton";

interface ArtistResult {
  id: string;
  name: string;
  slug?: string | null;
  image: string;
  location: string;
  rating: string;
  reviewCount: number;
  price: number;
  verified: boolean;
  bio: string;
  categories: string[];
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArtistResult[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string; slug: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchArtists = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (cat) params.set("category", cat);
      const res = await fetch(`/api/artists?${params}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.artists || []);
        if (!cat) setCategories(data.categories || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    searchArtists("", "");
  }, [searchArtists]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchArtists(query, selectedCategory);
  };

  const handleCategory = (slug: string) => {
    const next = slug === selectedCategory ? "" : slug;
    setSelectedCategory(next);
    searchArtists(query, next);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Find Makeup Artists</h1>
          <p className="text-sm text-gray-500">Search by name, location, or style</p>
        </div>

        <form onSubmit={handleSearch} className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artists, locations, styles..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm"
          />
        </form>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => handleCategory("")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                !selectedCategory
                  ? "bg-rose-500 text-white"
                  : "bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-700"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => handleCategory(cat.slug)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedCategory === cat.slug
                    ? "bg-rose-500 text-white"
                    : "bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-700"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : results.length === 0 && searched ? (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No artists found</h3>
            <p className="text-sm text-gray-500">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.slug || artist.id}`}
                className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 hover:shadow-md hover:border-rose-200 dark:hover:border-rose-900/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-rose-500 transition-colors flex items-center gap-1.5">
                      {artist.name}
                      {artist.verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                    </h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {artist.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{artist.rating}</span>
                  </div>
                </div>
                {artist.bio && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{artist.bio}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">MYR {artist.price}</p>
                  <span className="text-xs text-rose-500 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    View <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
