"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3, Users, DollarSign, Star, TrendingUp,
  Calendar, Clock, Wallet, Store, Package, Briefcase,
} from "lucide-react";
import Skeleton from "@/components/Skeleton";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/context/AuthContext";

interface StudioStats {
  artists: number;
  bookings: number;
  revenue: number;
  rating: number;
  pendingBalance: number;
}

interface RecentBooking {
  id: string;
  date: string;
  time: string;
  status: string;
  amount: string;
  artistName: string;
  userName: string;
}

export default function DashboardStudio() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudioStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [studioName, setStudioName] = useState("");
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/studios?action=dashboard&userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentBookings(data.recentBookings || []);
          setStudioName(data.studio?.name || "Studio Dashboard");
        } else {
          setFetchError("Failed to load dashboard data");
        }
      } catch (err) {
        console.error("Failed to load studio dashboard:", err);
        setFetchError("Network error — check your connection");
      }
      setLoading(false);
    };
    fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Skeleton className="h-8 w-48 sm:w-64 mb-6 sm:mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Studio Not Found</h2>
        <p className="text-gray-500">No studio linked to your account.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">{studioName}</h1>

        {fetchError && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-sm text-red-600 dark:text-red-400">
            {fetchError}
          </div>
        )}

        <div className="flex gap-1.5 mb-8 overflow-x-auto pb-1">
          {[
            { href: "/dashboard/studio", label: "Overview", icon: BarChart3 },
            { href: "/dashboard/studio/calendar", label: "Calendar", icon: Calendar },
            { href: "/dashboard/studio/staff", label: "Staff", icon: Users },
            { href: "/dashboard/studio/finance", label: "Finance", icon: DollarSign },
            { href: "/dashboard/studio/inventory", label: "Inventory", icon: Package },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                href === "/dashboard/studio"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "bg-white dark:bg-neutral-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {([
            { icon: Users, label: "Artists", value: stats.artists, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
            { icon: BarChart3, label: "Bookings", value: stats.bookings, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
            { icon: DollarSign, label: "Revenue", value: `MYR ${stats.revenue.toLocaleString()}`, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
            { icon: Star, label: "Rating", value: stats.rating, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
          ] as const).map((props) => (
            <StatCard key={props.label} {...props} />
          ))}
        </div>

        {stats.pendingBalance > 0 && (
          <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/50 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-amber-500" />
              <span className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-300">Pending Balance</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-amber-800 dark:text-amber-200">MYR {stats.pendingBalance.toLocaleString()}</p>
          </div>
        )}

        <div className="p-4 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Bookings</h2>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-gray-400">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.userName || "Anonymous"} &rarr; {b.artistName}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3 h-3" />{b.date}
                      <Clock className="w-3 h-3 ml-1" />{b.time || "—"}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                    b.status === "confirmed"
                      ? "bg-green-50 text-green-600 dark:bg-green-950/30"
                      : b.status === "completed"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30"
                        : b.status === "cancelled"
                          ? "bg-red-50 text-red-600 dark:bg-red-950/30"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-950/30"
                  }`}>{b.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
