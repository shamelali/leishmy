"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3, DollarSign, Users, Star, TrendingUp, Calendar,
} from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { studioItems } from "@/components/dashboard/studioNav";
import { useAuth } from "@/context/AuthContext";
import StatCard from "@/components/StatCard";

interface Analytics {
  totalBookings: number;
  thisMonthBookings: number;
  bookingChange: string;
  revenue: number;
  revenueChange: string;
  thisMonthClients: number;
  clientChange: string;
  avgRating: number;
  paidCount: number;
  monthlyBookings: { month: string; count: number }[];
  artistBreakdown: { name: string; bookings: number; revenue: number }[];
  serviceBreakdown: { name: string; count: number; revenue: number }[];
}

export default function StudioAnalytics() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await fetch(`/api/analytics?studioId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        } else {
          setError("Failed to load analytics");
        }
      } catch {
        setError("Network error");
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const activeId = studioItems.find((item) => pathname === item.href)?.id || "overview";

  const maxMonthly = analytics ? Math.max(...analytics.monthlyBookings.map((m) => m.count), 1) : 1;

  return (
    <DashboardSidebar items={studioItems} activeId={activeId}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <DashboardLoading />
        ) : analytics ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={BarChart3} label="Total Bookings" value={analytics.totalBookings} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-950/30" change={analytics.bookingChange} sub={`${analytics.thisMonthBookings} this month`} />
              <StatCard icon={DollarSign} label="Revenue" value={`MYR ${analytics.revenue.toLocaleString()}`} color="text-green-500" bg="bg-green-50 dark:bg-green-950/30" change={analytics.revenueChange} />
              <StatCard icon={Users} label="Clients" value={analytics.thisMonthClients} color="text-violet-500" bg="bg-violet-50 dark:bg-violet-950/30" change={analytics.clientChange} sub="this month" />
              <StatCard icon={Star} label="Avg Rating" value={analytics.avgRating || "—"} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-950/30" sub={`${analytics.paidCount} paid bookings`} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" /> Monthly Bookings
                </h2>
                <div className="flex items-end gap-1.5 h-40">
                  {analytics.monthlyBookings.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-rose-400 dark:bg-rose-500 rounded-t-md transition-all"
                        style={{ height: `${(m.count / maxMonthly) * 100}%`, minHeight: m.count > 0 ? "4px" : "0" }}
                      />
                      <span className="text-[9px] text-gray-400">{m.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" /> Staff Performance
                </h2>
                {analytics.artistBreakdown && analytics.artistBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.artistBreakdown.map((a) => (
                      <div key={a.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{a.name}</p>
                          <p className="text-xs text-gray-400">{a.bookings} bookings</p>
                        </div>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">MYR {a.revenue.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-8 text-center">No staff data yet</p>
                )}
              </div>
            </div>

            {analytics.serviceBreakdown && analytics.serviceBreakdown.length > 0 && (
              <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" /> Service Breakdown
                </h2>
                <div className="space-y-2">
                  {analytics.serviceBreakdown.map((s) => (
                    <div key={s.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.count} bookings</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">MYR {s.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-16">No analytics data available yet.</p>
        )}
      </div>
    </DashboardSidebar>
  );
}
