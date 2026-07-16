"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, ArrowLeft, Wallet, Banknote, Download, CheckCircle, Clock, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardLoading } from "@/components/DashboardLoading";
import { useAuth } from "@/context/AuthContext";

interface Payout {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

const payoutStatusIcon: Record<string, typeof Clock> = {
  paid: CheckCircle,
  pending: Clock,
  failed: XCircle,
};

const payoutStatusColor: Record<string, string> = {
  paid: "text-green-600 bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/50",
  pending: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50",
  failed: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50",
};

export default function StudioFinance() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      try {
        const [paymentsData, studioData] = await Promise.all([
          fetch(`/api/payments?action=payouts&userId=${user.id}`).then((r) => r.json()),
          fetch(`/api/studios?action=dashboard&userId=${user.id}`).then((r) => r.json()),
        ]);
        if (paymentsData?.pendingBalance !== undefined) setPendingBalance(paymentsData.pendingBalance);
        if (paymentsData?.payouts) setPayouts(paymentsData.payouts);
        if (studioData?.stats?.revenue !== undefined) setRevenue(studioData.stats.revenue);
      } catch { console.error("Failed to load finance data"); }
      setLoading(false);
    })();
  }, [user?.id]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/studio" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('backToDashboard')}
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('finance.title')}</h1>

        {loading ? (
          <DashboardLoading />
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="p-5 bg-green-50 dark:bg-green-950/30 rounded-2xl border border-green-100 dark:border-green-900/50">
                <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-green-500" /><span className="text-xs font-medium text-green-600 dark:text-green-400">{t('finance.totalRevenue')}</span></div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">MYR {revenue.toLocaleString()}</p>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3" /> {t('finance.liveFromBookings')}</p>
              </div>
              <div className="p-5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                <div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-amber-500" /><span className="text-xs font-medium text-amber-600 dark:text-amber-400">{t('finance.pendingPayouts')}</span></div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">MYR {pendingBalance.toLocaleString()}</p>
              </div>
              <div className="p-5 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                <div className="flex items-center gap-2 mb-2"><Banknote className="w-4 h-4 text-blue-500" /><span className="text-xs font-medium text-blue-600 dark:text-blue-400">{t('finance.commission')}</span></div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">15%</p>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('finance.payoutHistory')}</h2>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50"><Download className="w-3.5 h-3.5" /> {t('finance.export')}</button>
              </div>
              {payouts.length === 0 ? (
                <p className="text-sm text-gray-400">{t('finance.noTransactions')}</p>
              ) : (
                <div className="space-y-2">
                  {payouts.map((p) => {
                    const Icon = payoutStatusIcon[p.status] || Clock;
                    const colorClass = payoutStatusColor[p.status] || "";
                    return (
                      <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${colorClass}`}>
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold capitalize">{t(`finance.${p.status}`)}</p>
                            <p className="text-xs opacity-70">
                              {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : ""}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-bold">MYR {Number(p.amount).toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
    </div>
  );
}
