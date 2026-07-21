"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, MapPin, User, ArrowRight, Sparkles, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface BookingItem {
  id: number;
  artistId: string;
  artistName?: string;
  clientName: string;
  clientEmail: string;
  service: string;
  date: string;
  time: string;
  status: string;
  notes?: string;
}

export default function BookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "confirmed" | "cancelled">("all");

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/bookings?userId=${user.id}`);
        const data = await res.json();
        if (data.bookings) {
          setBookings(data.bookings);
        }
      } catch (err) {
        console.error("Failed to load bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user?.id) {
      fetchBookings();
    }
  }, [authLoading, user]);

  const handleCancel = async (id: number) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "cancelled" }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
      );
    } catch {
      // silent — booking stays confirmed
    }
  };

  const filtered = bookings.filter((b) => {
    if (filter === "all") return true;
    return b.status === filter;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white">
              My Bookings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your beauty appointments and schedules.
            </p>
          </div>

          <Link
            href="/artists"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 hover:scale-105 active:scale-100 transition-all text-sm self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" /> Book New Session
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-neutral-800 pb-4">
          {(["all", "confirmed", "cancelled"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                filter === tab
                  ? "bg-rose-500 text-white"
                  : "bg-white dark:bg-neutral-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-neutral-800 hover:border-rose-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-400">Loading appointments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-12 text-center shadow-sm">
            <Calendar className="w-12 h-12 text-rose-300 dark:text-rose-900 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No bookings found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
              You haven&apos;t scheduled any appointments in this status category yet.
            </p>
            <Link
              href="/artists"
              className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white font-bold rounded-xl text-sm shadow-md"
            >
              Explore Artists <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        booking.status === "confirmed"
                          ? "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {booking.status}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">#{booking.id}</span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {booking.service || "Beauty Service"}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
                    <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                      <User className="w-3.5 h-3.5 text-rose-500" /> {booking.artistName || `Artist #${booking.artistId}`}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" /> {new Date(booking.date).toLocaleDateString("en-MY", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-500" /> {booking.time}
                    </span>
                  </div>

                  {booking.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-neutral-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-neutral-800 mt-2">
                      &ldquo;{booking.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 dark:border-neutral-800 self-end md:self-center shrink-0">
                  <Link
                    href={`/artists/${booking.artistId}`}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    View Artist
                  </Link>

                  {booking.status === "confirmed" && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
