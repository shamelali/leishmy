"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Star, MapPin } from "lucide-react";
import ImageWithFallback from "@/components/ImageWithFallback";
import { categories } from "@/lib/data";

interface ArtistResult {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: string;
}

export default function SearchModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [artists, setArtists] = useState<ArtistResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open) setQuery("");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) {
      setArtists([]);
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(
        `/api/artists?limit=5&search=${encodeURIComponent(q)}`,
      );
      const data = await r.json();
      setArtists(data.artists || []);
    } catch {
      setArtists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  const categoryResults = query.trim()
    ? categories
        .filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.id.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 3)
    : [];

  const hasResults = artists.length > 0 || categoryResults.length > 0;

  const closeAndNavigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm text-gray-400 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl hover:border-rose-200 dark:hover:border-rose-800 transition-all min-w-[200px]"
      >
        <Search className="w-4 h-4" />
        <span>Search artists, studios...</span>
        <kbd className="ml-auto px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-neutral-700 rounded">
          ⌘K
        </kbd>
      </button>

      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh]">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-xl mx-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 overflow-hidden animate-scale-in">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-neutral-800">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search artists, studios..."
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-neutral-800 rounded">
                ESC
              </kbd>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {query.trim() === "" ? (
                <div className="p-8 text-center">
                  <Search className="w-8 h-8 text-gray-200 dark:text-neutral-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Search artists, studios...
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {categories.slice(0, 5).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => closeAndNavigate(`/artists?category=${cat.id}`)}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      >
                        {cat.icon} {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : !hasResults && !loading ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No results found for &ldquo;{query}&rdquo;
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {categoryResults.length > 0 && (
                    <>
                      <p className="px-5 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Categories
                      </p>
                      {categoryResults.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => closeAndNavigate(`/artists?category=${cat.id}`)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                        >
                          <span className="text-lg">{cat.icon}</span>
                          <div className="flex-1">
                            <span className="font-medium">{cat.name}</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-neutral-600" />
                        </button>
                      ))}
                    </>
                  )}
                  {artists.length > 0 && (
                    <>
                      <p className="px-5 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-1">
                        Artists
                      </p>
                      {artists.map((artist) => (
                        <button
                          key={artist.id}
                          onClick={() => closeAndNavigate(`/artists/${artist.id}`)}
                          className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                        >
                          <ImageWithFallback
                            src={artist.image}
                            alt={artist.name}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {artist.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              <MapPin className="w-3 h-3 inline" />{" "}
                              {artist.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {artist.rating}
                            </span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  {query.trim() && (
                    <div className="px-5 py-3 border-t border-gray-50 dark:border-neutral-800">
                      <button
                        onClick={() => closeAndNavigate(`/artists?search=${encodeURIComponent(query)}`)}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium flex items-center gap-1"
                      >
                        View All <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
