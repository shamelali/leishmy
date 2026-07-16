"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, TrendingUp, Users, DollarSign, ArrowLeft, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardLoading } from "@/components/DashboardLoading";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/context/AuthContext";

export default function ArtistAnalytics() {
  const t = useTranslations("dashboard.artist");
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const profileRes = await fetch(`/api/user/artist-profile`);
        const profile = await profileRes.json();
        if (!profile?.artist?.id) return;
        const res = await fetch(`/api/analytics?artistId=${profile.artist.id}`);
        const json = await res.json();
        if (json?.totalBookings !== undefined) setData(json);
      } catch { console.error("Failed to load analytics"); }
      setLoading(false);
    })();
  }, [user?.id]);

  if (loading) {
    return <DashboardLoading fullPage />;
  }

  const stats = data ? [
    { icon: BarChart3, label: t('totalBookings'), value: String(data.totalBookings), change: data.bookingChange, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { icon: DollarSign, label: t('revenue'), value: `MYR ${data.revenue?.toLocaleString() || 0}`, change: data.revenueChange, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
    { icon: Users, label: "Bookings This Month", value: String(data.thisMonthClients), change: data.clientChange, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
    { icon: Star, label: "Avg. Rating", value: String(data.avgRating || "—"), change: `${data.paidCount || 0} paid`, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  ] : [];

  const months = data?.monthlyBookings?.map((m: any) => m.month) || [];
  const maxCount = Math.max(1, ...(data?.monthlyBookings?.map((m: any) => m.count) || [1]));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/artist" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {!data ? (
          <div className="text-center py-16">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No analytics data yet.</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('analytics')}</h1>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((props) => (
                <StatCard key={props.label} {...props} size="sm" />
              ))}
            </div>

            <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly Bookings ({new Date().getFullYear()})</h2>
              <div className="h-48 flex items-end justify-between gap-2">
                {data.monthlyBookings.map((m: any) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">{m.count}</span>
                    <div
                      className="w-full bg-rose-100 dark:bg-rose-950/30 rounded-t-lg transition-all"
                      style={{ height: `${(m.count / maxCount) * 100}%` }}
                    />
                    <span className="text-[10px] text-gray-400">{m.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
    </div>
  );
}
