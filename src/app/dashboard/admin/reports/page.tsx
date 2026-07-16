"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, ArrowLeft, Download } from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";
import { useTranslations } from "next-intl";

function pct(num: number, denom: number): string {
  if (denom <= 0) return num > 0 ? "+100%" : "0%";
  const v = Math.round(((num - denom) / denom) * 100);
  return v >= 0 ? `+${v}%` : `${v}%`;
}

export default function AdminReports() {
  const t = useTranslations("dashboard");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin?action=overview")
      .then((r) => r.json())
      .then((json) => { if (json?.totalUsers !== undefined) setData(json); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <DashboardLoading fullPage />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray-500">{t('reports.noData')}</p>
      </div>
    );
  }

  const growthItems = [
    { label: t('reports.newUsers'), value: `+${data.newUsersThisMonth}`, change: pct(data.newUsersThisMonth, data.newUsersLastMonth), color: "text-blue-500" },
    { label: t('reports.newArtists'), value: `+${data.newArtistsThisMonth}`, change: pct(data.newArtistsThisMonth, data.newArtistsLastMonth), color: "text-violet-500" },
    { label: t('reports.newBookings'), value: `+${data.newBookingsThisMonth}`, change: pct(data.newBookingsThisMonth, data.newBookingsLastMonth), color: "text-green-500" },
  ];

  const commission = Math.round(data.revenueThisMonth * data.commissionRate);

  const revenueItems = [
    { label: t('reports.thisMonth'), value: `MYR ${data.revenueThisMonth?.toLocaleString() || 0}` },
    { label: t('reports.lastMonth'), value: `MYR ${data.revenueLastMonth?.toLocaleString() || 0}` },
    { label: t('reports.commissionEarned'), value: `MYR ${commission.toLocaleString()}` },
    { label: t('reports.pendingPayouts'), value: `MYR ${data.pendingPayouts?.toLocaleString() || 0}` },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('backToDashboard')}
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports.title')}</h1>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50">
            <Download className="w-3.5 h-3.5" /> {t('reports.exportAll')}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('reports.platformGrowth')}</h3>
            <div className="space-y-3">
              {growthItems.map(({ label, value, change, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${color}`}>{value}</span>
                    <span className="text-[10px] text-green-500 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />{change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('reports.revenueSummary')}</h3>
            <div className="space-y-3">
              {revenueItems.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('reports.totals')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Users, label: t('reports.totalUsers'), value: String(data.totalUsers), color: "text-blue-500", bg: "bg-blue-50" },
              { icon: BarChart3, label: t('reports.totalArtists'), value: String(data.totalArtists), color: "text-violet-500", bg: "bg-violet-50" },
              { icon: Calendar, label: t('reports.totalBookings'), value: String(data.totalBookings), color: "text-green-500", bg: "bg-green-50" },
              { icon: DollarSign, label: t('reports.totalRevenue'), value: `MYR ${data.totalRevenue?.toLocaleString() || 0}`, color: "text-amber-500", bg: "bg-amber-50" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className={`p-4 ${bg} dark:bg-neutral-800 rounded-xl`}>
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 mt-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('reports.downloadReports')}</h2>
          <div className="space-y-2">
            {[t('reports.userReport'), t('reports.artistReport'), t('reports.bookingReport'), t('reports.paymentReport'), t('reports.revenueReport')].map((r) => (
              <div key={r} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500 text-white hover:bg-rose-600">
                  <Download className="w-3 h-3" /> {t('reports.csv')}
                </button>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
