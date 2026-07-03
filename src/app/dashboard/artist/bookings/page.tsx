"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ArtistBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/user?action=bookings&userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.bookings) setBookings(data.bookings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = filter === "all" ? bookings : bookings.filter((b: any) => b.status === filter);

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full">Pending</span>;
      case "confirmed": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-full">Confirmed</span>;
      case "completed": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 rounded-full">Completed</span>;
      case "cancelled": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full">Cancelled</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/artist" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Bookings</h1>
          <div className="flex gap-1 bg-gray-100 dark:bg-neutral-800 rounded-lg p-0.5">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${filter === f ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{f}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b: any) => (
              <div key={b.id} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{b.client || b.userName || "Anonymous"}</span>
                  {statusBadge(b.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {b.date ? new Date(b.date).toLocaleDateString("en-MY") : "—"}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.time || "—"}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">MYR {b.price || b.amount || 0}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{b.service || "Beauty Service"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
