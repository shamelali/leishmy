"use client";

import { useState, useEffect } from "react";
import {
  Users, Building2, DollarSign, BarChart3, TrendingUp,
  Calendar, Star, Shield, Palette, UserCheck,
} from "lucide-react";
import Skeleton from "@/components/Skeleton";
import StatCard from "@/components/StatCard";

interface AdminStats {
  totalUsers: number;
  totalArtists: number;
  totalStudios: number;
  totalBookings: number;
  totalRevenue: number;
  avgRating: number;
  pendingPayouts: number;
  newUsersThisMonth: number;
  pendingPayoutCount: number;
}

interface ActivityItem {
  action: string;
  detail: string;
  time: string;
  type: string;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setFetchError("");
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch("/api/admin"),
          fetch("/api/admin?action=recent-activity"),
        ]);
        if (statsRes.ok) {
          setStats(await statsRes.json());
        } else {
          setFetchError("Failed to load overview data");
        }
        if (activityRes.ok) {
          const data = await activityRes.json();
          setRecentActivity(data.activity || []);
        }
      } catch {
        setFetchError("Network error — check your connection");
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Platform overview and management
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 rounded-full self-start sm:self-auto">
          <Shield className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            Admin
          </span>
        </div>
      </div>

      {fetchError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-sm text-red-600 dark:text-red-400">
          {fetchError}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))
          : [
              {
                icon: Users,
                label: "Total Users",
                value: stats ? stats.totalUsers.toLocaleString() : "—",
                sub: stats ? `+${stats.newUsersThisMonth} this month` : "",
                color: "text-blue-500",
                bg: "bg-blue-50 dark:bg-blue-950/30",
              },
              {
                icon: Building2,
                label: "Artists / Studios",
                value: stats
                  ? `${stats.totalArtists} / ${stats.totalStudios}`
                  : "—",
                sub: `${stats ? stats.totalArtists + stats.totalStudios : 0} total vendors`,
                color: "text-violet-500",
                bg: "bg-violet-50 dark:bg-violet-950/30",
              },
              {
                icon: Calendar,
                label: "Total Bookings",
                value: stats ? stats.totalBookings.toLocaleString() : "—",
                sub: "Across all services",
                color: "text-green-500",
                bg: "bg-green-50 dark:bg-green-950/30",
              },
              {
                icon: DollarSign,
                label: "Total Revenue",
                value: stats
                  ? `MYR ${stats.totalRevenue.toLocaleString()}`
                  : "—",
                sub: stats
                  ? `MYR ${stats.pendingPayouts.toLocaleString()} pending`
                  : "",
                color: "text-amber-500",
                bg: "bg-amber-50 dark:bg-amber-950/30",
              },
              {
                icon: Star,
                label: "Average Rating",
                value: stats ? String(stats.avgRating) : "—",
                sub: "Platform-wide",
                color: "text-rose-500",
                bg: "bg-rose-50 dark:bg-rose-950/30",
              },
              {
                icon: TrendingUp,
                label: "Growth Rate",
                value: "+18%",
                sub: "vs last month",
                color: "text-emerald-500",
                bg: "bg-emerald-50 dark:bg-emerald-950/30",
              },
              {
                icon: DollarSign,
                label: "Pending Payouts",
                value: stats
                  ? `MYR ${stats.pendingPayouts.toLocaleString()}`
                  : "—",
                sub: `${stats?.pendingPayoutCount || 0} payout${stats?.pendingPayoutCount !== 1 ? "s" : ""}`,
                color: "text-orange-500",
                bg: "bg-orange-50 dark:bg-orange-950/30",
              },
              {
                icon: BarChart3,
                label: "Conversion Rate",
                value: "12.4%",
                sub: "Views to bookings",
                color: "text-cyan-500",
                bg: "bg-cyan-50 dark:bg-cyan-950/30",
              },
            ].map((props) => (
              <StatCard key={props.label} {...props} size="lg" />
            ))}
      </div>

      <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Recent Platform Activity
        </h2>
        <div className="space-y-3">
          {recentActivity.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl"
            >
              <div
                className={`p-1.5 rounded-lg ${
                  item.type === "artist"
                    ? "bg-violet-100 dark:bg-violet-900/30"
                    : item.type === "payment"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : item.type === "booking"
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : item.type === "user"
                          ? "bg-amber-100 dark:bg-amber-900/30"
                          : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                {item.type === "artist" ? (
                  <Palette className="w-4 h-4 text-violet-500" />
                ) : item.type === "payment" ? (
                  <DollarSign className="w-4 h-4 text-green-500" />
                ) : item.type === "booking" ? (
                  <Calendar className="w-4 h-4 text-blue-500" />
                ) : item.type === "user" ? (
                  <UserCheck className="w-4 h-4 text-amber-500" />
                ) : (
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.action}
                </p>
                <p className="text-xs text-gray-400">{item.detail}</p>
              </div>
              <span className="text-xs text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
