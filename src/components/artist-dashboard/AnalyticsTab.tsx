"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Star,
  Calendar,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

interface AnalyticsData {
  totalBookings: number;
  thisMonthBookings: number;
  bookingChange: string;
  revenue: number;
  revenueChange: string;
  thisMonthClients: number;
  clientChange: string;
  avgRating: number;
  paidCount: number;
  monthlyBookings: Array<{ month: string; count: number }>;
}

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics?artistId=me");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load analytics: {error || "No data"}
      </div>
    );
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(n);

  const changeColor = (str: string) =>
    str.startsWith("+") ? "text-green-600 dark:text-green-400" : str.startsWith("-") ? "text-red-600 dark:text-red-400" : "text-gray-500";

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-rose-500" />}
          label="Total Bookings"
          value={data.totalBookings.toLocaleString()}
          change={data.bookingChange}
          changeColor={changeColor(data.bookingChange)}
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-green-500" />}
          label="Revenue"
          value={formatCurrency(data.revenue)}
          change={data.revenueChange}
          changeColor={changeColor(data.revenueChange)}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-500" />}
          label="Clients This Month"
          value={data.thisMonthClients.toLocaleString()}
          change={data.clientChange}
          changeColor={changeColor(data.clientChange)}
        />
        <StatCard
          icon={<Star className="w-5 h-5 text-amber-500" />}
          label="Avg Rating"
          value={data.avgRating.toFixed(1)}
          change={`${data.paidCount} paid bookings`}
          changeColor="text-gray-500"
        />
      </div>

      {/* Monthly Chart */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Bookings by Month</h3>
        <div className="flex items-end gap-2 h-64">
          {data.monthlyBookings.map((m, i) => {
            const maxCount = Math.max(...data.monthlyBookings.map((d) => d.count), 1);
            const height = (m.count / maxCount) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full bg-rose-500 rounded-t transition-all hover:bg-rose-400"
                  style={{ height: `${Math.max(height, 4)}%`, minHeight: "4px" }}
                  title={`${m.month}: ${m.count}`}
                />
                <span className="text-[10px] text-gray-500">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Quick Summary</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
            <p className="text-xs text-gray-500">Completed This Month</p>
            <p className="text-2xl font-bold text-rose-500">{data.thisMonthBookings}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
            <p className="text-xs text-gray-500">Paid Bookings</p>
            <p className="text-2xl font-bold text-green-500">{data.paidCount}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
            <p className="text-xs text-gray-500">Avg Rating</p>
            <p className="text-2xl font-bold text-amber-500">{data.avgRating.toFixed(1)} / 5</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, change, changeColor }: any) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-rose-50 dark:bg-rose-950/20 rounded-lg">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
      {change && <p className={`text-xs font-medium mt-1 ${changeColor}`}>{change}</p>}
    </div>
  );
}