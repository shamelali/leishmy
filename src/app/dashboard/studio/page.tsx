"use client";

import { useState, useEffect } from "react";
import {
  BarChart3, Users, DollarSign, Star, TrendingUp,
  Calendar, Clock, Wallet,
} from "lucide-react";
import Skeleton from "@/components/Skeleton";
import ProtectedRoute from "@/components/ProtectedRoute";
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
        }
      } catch (err) {
        console.error("Failed to load studio dashboard:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-64 mb-8" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Studio Not Found</h2>
        <p className="text-gray-500">No studio linked to your account.</p>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["studio"]}>
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{studioName}</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {([
            { icon: Users, label: "Artists", value: stats.artists, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
            { icon: BarChart3, label: "Bookings", value: stats.bookings, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
            { icon: DollarSign, label: "Revenue", value: `MYR ${stats.revenue.toLocaleString()}`, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
            { icon: Star, label: "Rating", value: stats.rating, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
          ] as const).map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className={`p-6 ${bg} rounded-2xl border border-gray-100 dark:border-neutral-800`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        {stats.pendingBalance > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/50 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Pending Balance</span>
            </div>
            <p className="text-lg font-bold text-amber-800 dark:text-amber-200">MYR {stats.pendingBalance.toLocaleString()}</p>
          </div>
        )}

        <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Bookings</h2>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-gray-400">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{b.userName || "Anonymous"} &rarr; {b.artistName}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3 h-3" />{b.date}
                      <Clock className="w-3 h-3 ml-1" />{b.time || "—"}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
    </div>
    </ProtectedRoute>
  );
}
