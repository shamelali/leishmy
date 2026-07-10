"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, Clock, ArrowRight, ExternalLink, Search } from "lucide-react";
import Skeleton from "@/components/Skeleton";

interface EventItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  date: string;
  endDate: string | null;
  time: string | null;
  endTime: string | null;
  location: string | null;
  address: string | null;
  category: string;
  image: string | null;
  organizerName: string | null;
  organizerContact: string | null;
  ticketUrl: string | null;
  featured: boolean;
  published: boolean;
}

const categories = ["All", "Workshop", "Expo", "Masterclass", "Competition", "Networking"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-MY", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (search) params.set("search", search);
    fetch(`/api/events?${params.toString()}`)
      .then((r) => r.json())
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, search]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <section className="bg-gradient-to-br from-rose-50 via-pink-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white">
            Events
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
            Discover beauty events, workshops, and masterclasses.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    category === cat
                      ? "bg-rose-500 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800">
                  <Skeleton className="aspect-[2/1]" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))
            ) : events.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 dark:text-gray-500 text-lg">No events found</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Check back later for upcoming events.</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 hover:border-rose-200 dark:hover:border-rose-800 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative aspect-[2/1] overflow-hidden">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600/80 backdrop-blur-sm rounded-full">
                        {event.category}
                      </span>
                    </div>
                    {event.featured && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-500/80 backdrop-blur-sm rounded-full">
                          Featured
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                      {event.title}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
                        {formatDate(event.date)}
                        {event.endDate && <> — {formatDate(event.endDate)}</>}
                      </span>
                      {event.time && (
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                          {formatTime(event.time)}
                          {event.endTime && <> — {formatTime(event.endTime)}</>}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                        {event.location || "TBA"}
                      </span>
                    </div>

                    {event.description && (
                      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      {event.ticketUrl && (
                        <a
                          href={event.ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-all shadow-sm"
                        >
                          Get Tickets <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {event.organizerName && (
                        <span className="text-xs text-gray-400">
                          by {event.organizerName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
