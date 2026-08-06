"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, DollarSign, BarChart3, ArrowUp, ArrowDown, Calendar } from "lucide-react";
import StatCard from "@/components/StatCard";
import { DashboardLoading } from "@/components/DashboardLoading";

type Period = "7d" | "30d" | "90d";

interface AnalyticsData {
  gmv: number;
  gmvThisPeriod: number;
  gmvLastPeriod: number;
  activeUsers: number;
  activeUsersLastPeriod: number;
  totalUsers: number;
  newUsersThisPeriod: number;
  conversionRate: number;
  conversionRateLastPeriod: number;
  avgOrderValue: number;
  bookingsByStatus: { status: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  topArtists: { id: string; name: string; bookingCount: number }[];
  userGrowth: { month: string; count: number }[];
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading || !data) return <DashboardLoading />;

  const change = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const gmvChange = `${change(data.gmvThisPeriod, data.gmvLastPeriod).toFixed(1)}%`;
  const usersChange = `${change(data.activeUsers, data.activeUsersLastPeriod).toFixed(1)}%`;
  const conversionChange = `${change(data.conversionRate, data.conversionRateLastPeriod).toFixed(1)}%`;

  const maxRevenue = Math.max(...data.revenueByMonth.map((m) => m.revenue), 1);
  const maxBookings = Math.max(...data.bookingsByStatus.map((s) => s.count), 1);
  const maxUserGrowth = Math.max(...data.userGrowth.map((u) => u.count), 1);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Platform performance metrics and insights
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                period === p
                  ? "bg-rose-500 text-white"
                  : "border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={DollarSign}
          label="GMV (MYR)"
          value={`RM ${data.gmv.toLocaleString()}`}
          color="text-green-500"
          bg="bg-green-50 dark:bg-green-950/30"
          change={gmvChange}
        />
        <StatCard
          icon={Users}
          label="Active Users"
          value={data.activeUsers.toLocaleString()}
          color="text-blue-500"
          bg="bg-blue-50 dark:bg-blue-950/30"
          change={usersChange}
        />
        <StatCard
          icon={BarChart3}
          label="Conversion Rate"
          value={`${data.conversionRate.toFixed(1)}%`}
          color="text-violet-500"
          bg="bg-violet-50 dark:bg-violet-950/30"
          change={conversionChange}
        />
        <StatCard
          icon={DollarSign}
          label="Avg Order Value"
          value={`RM ${data.avgOrderValue.toLocaleString()}`}
          color="text-amber-500"
          bg="bg-amber-50 dark:bg-amber-950/30"
        />
      </div>

      {/* Revenue by Month */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Revenue by Month
        </h2>
        <div className="space-y-4">
          {data.revenueByMonth.map((item) => (
            <div key={item.month} className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 w-20 shrink-0">
                {item.month}
              </span>
              <div className="flex-1 h-8 bg-gray-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-lg transition-all duration-500"
                  style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white w-24 text-right shrink-0">
                RM {item.revenue.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Bookings by Status */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Bookings by Status
          </h2>
          <div className="space-y-4">
            {data.bookingsByStatus.map((item) => (
              <div key={item.status} className="flex items-center gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0 capitalize">
                  {item.status}
                </span>
                <div className="flex-1 h-8 bg-gray-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                  <div
                    className={`h-full rounded-lg transition-all duration-500 ${
                      statusColors[item.status] || "bg-gray-400"
                    }`}
                    style={{ width: `${(item.count / maxBookings) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right shrink-0">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* User Growth */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            User Growth
          </h2>
          <div className="space-y-4">
            {data.userGrowth.map((item) => (
              <div key={item.month} className="flex items-center gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400 w-20 shrink-0">
                  {item.month}
                </span>
                <div className="flex-1 h-8 bg-gray-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-lg transition-all duration-500"
                    style={{ width: `${(item.count / maxUserGrowth) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right shrink-0">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Artists */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Top Artists
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-neutral-800">
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">
                  Rank
                </th>
                <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">
                  Artist Name
                </th>
                <th className="text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">
                  Bookings
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {data.topArtists.map((artist, i) => (
                <tr key={artist.id}>
                  <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {i + 1}
                  </td>
                  <td className="py-3 text-sm text-gray-700 dark:text-gray-300">
                    {artist.name}
                  </td>
                  <td className="py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                    {artist.bookingCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
