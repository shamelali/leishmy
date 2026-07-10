"use client";

import { useState, useEffect, useCallback, startTransition, useRef } from "react";
import Link from "next/link";
import { Search as SearchIcon, MapPin, Star, BadgeCheck, ArrowRight, Sparkles, X } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import { malaysiaStates } from "@/data/malaysia-locations";

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

const SORT_OPTIONS = [
  { value: "rating", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name" },
  { value: "newest", label: "Newest" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArtistResult[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string; slug: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const hasActiveFilters = selectedCategory || location || minPrice || maxPrice || sort !== "rating";

  const searchArtists = useCallback(async (q?: string, cat?: string, pageNum = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      if (cat) params.set("category", cat);
      if (location) params.set("location", location);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (sort !== "rating") params.set("sort", sort);
      params.set("page", String(pageNum));
      params.set("limit", "20");
      const res = await fetch(`/api/artists?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setResults((prev) => [...prev, ...(data.artists || [])]);
        } else {
          setResults(data.artists || []);
        }
        setTotalPages(data.totalPages || 1);
        setPage(pageNum);
        if (!cat && !append) setCategories(data.categories || []);
      }
    } catch { console.error("Search failed"); }
    if (append) {
      setLoadingMore(false);
    } else {
      setLoading(false);
    }
  }, [query, selectedCategory, location, minPrice, maxPrice, sort]);

  useEffect(() => {
    startTransition(() => {
      searchArtists(query, selectedCategory);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoSearch = useRef(false);

  useEffect(() => {
    if (autoSearch.current) {
      searchArtists(query, selectedCategory);
    }
    autoSearch.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, location, minPrice, maxPrice, sort, query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as HTMLFormElement;
    const input = target.querySelector("input");
    if (input) {
      setQuery(input.value);
    }
  };

  const handleCategory = (slug: string) => {
    setSelectedCategory(slug === selectedCategory ? "" : slug);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setSort("rating");
  };

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      searchArtists(query, selectedCategory, page + 1, true);
    }
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
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            placeholder="Search artists, locations, styles..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-sm"
          />
        </form>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedCategory("")}
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

        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              showFilters || hasActiveFilters
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                : "bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            Filters {hasActiveFilters && `(${+!!selectedCategory + +!!location + +!!minPrice + +!!maxPrice + +(sort !== "rating")})`}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-500 hover:text-rose-600 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-400 outline-none"
                >
                  <option value="">All Locations</option>
                  {malaysiaStates.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Min Price (MYR)</label>
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Max Price (MYR)</label>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Any"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Sort By</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-400 outline-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                searchArtists(query, selectedCategory);
                setShowFilters(false);
              }}
              className="mt-4 px-4 py-2 bg-rose-500 text-white text-sm font-medium rounded-lg hover:bg-rose-600 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        )}

        {loading && searched && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        )}

        {!loading && results.length === 0 && searched && (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No artists found</h3>
            <p className="text-sm text-gray-500">Try a different search or adjust your filters</p>
          </div>
        )}

        {!loading && results.length > 0 && (
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
          {results.length > 0 && page < totalPages && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? (
                  <span className="w-4 h-4 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        )}
      </div>
    </div>
  );
}
