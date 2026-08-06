"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditCard, DollarSign, Search, CheckCircle, RefreshCw } from "lucide-react";
import StatCard from "@/components/StatCard";
import { DashboardLoading } from "@/components/DashboardLoading";
import Skeleton from "@/components/Skeleton";

interface Payment {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

interface Payout {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  commission: number;
  netAmount: number;
  status: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
  held: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
  paid: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
  released: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
  refunded: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  failed: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
};

type Tab = "payments" | "payouts";

export default function PaymentMonitoringPage() {
  const [activeTab, setActiveTab] = useState<Tab>("payments");
  const [search, setSearch] = useState("");
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);
  const [payoutsTotalPages, setPayoutsTotalPages] = useState(1);
  const [selectedPayouts, setSelectedPayouts] = useState<number[]>([]);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayouts: 0,
    totalTransactions: 0,
  });

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin?action=payments&page=1&pageSize=1");
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalRevenue: data.totalRevenue || 0,
          pendingPayouts: data.pendingPayouts || 0,
          totalTransactions: data.totalTransactions || 0,
        });
      }
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const res = await fetch(`/api/admin?action=payments&page=${paymentsPage}&pageSize=20`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setPaymentsTotalPages(data.totalPages || 1);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingPayments(false);
    }
  }, [paymentsPage]);

  const fetchPayouts = useCallback(async () => {
    setLoadingPayouts(true);
    try {
      const res = await fetch(`/api/admin?action=pending-payouts&page=${payoutsPage}&pageSize=20`);
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts || []);
        setPayoutsTotalPages(data.totalPages || 1);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingPayouts(false);
    }
  }, [payoutsPage]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const handleMarkPaid = async (payoutIds: number[]) => {
    if (payoutIds.length === 0 || markingPaid) return;
    setMarkingPaid(true);
    try {
      const res = await fetch("/api/admin?action=mark-payouts-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutIds }),
      });
      if (res.ok) {
        setSelectedPayouts([]);
        fetchPayouts();
        fetchStats();
      }
    } catch {
      // silently fail
    } finally {
      setMarkingPaid(false);
    }
  };

  const togglePayoutSelection = (id: number) => {
    setSelectedPayouts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const toggleAllPayouts = () => {
    const pendingIds = payouts
      .filter((p) => p.status === "pending")
      .map((p) => Number(p.id));
    if (selectedPayouts.length === pendingIds.length) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(pendingIds);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      p.userName?.toLowerCase().includes(term) ||
      p.paymentMethod?.toLowerCase().includes(term) ||
      p.status?.toLowerCase().includes(term) ||
      String(p.amount).includes(term)
    );
  });

  const filteredPayouts = payouts.filter((p) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      p.userName?.toLowerCase().includes(term) ||
      p.status?.toLowerCase().includes(term) ||
      String(p.amount).includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-8">
          <CreditCard className="w-7 h-7 text-rose-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Payment Monitoring
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track all transactions and payouts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {statsLoading ? (
            <>
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </>
          ) : (
            <>
              <StatCard
                icon={DollarSign}
                label="Total Revenue"
                value={`MYR ${stats.totalRevenue.toLocaleString()}`}
                color="text-green-500"
                bg="bg-green-50 dark:bg-green-950/20"
              />
              <StatCard
                icon={CreditCard}
                label="Pending Payouts"
                value={`MYR ${stats.pendingPayouts.toLocaleString()}`}
                color="text-amber-500"
                bg="bg-amber-50 dark:bg-amber-950/20"
              />
              <StatCard
                icon={RefreshCw}
                label="Total Transactions"
                value={stats.totalTransactions.toLocaleString()}
                color="text-blue-500"
                bg="bg-blue-50 dark:bg-blue-950/20"
              />
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-neutral-800 rounded-xl">
            {(["payments", "payouts"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === tab
                    ? "bg-white dark:bg-neutral-900 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab === "payments" ? "Payments" : "Payouts"}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-0 sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, status, or method..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>
        </div>

        {activeTab === "payments" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            {loadingPayments ? (
              <div className="p-8">
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-16">
                <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  No payments found
                </h3>
                <p className="text-sm text-gray-500">
                  {search ? "Try adjusting your search" : "No payment records yet"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="text-left font-medium px-4 py-3">ID</th>
                        <th className="text-left font-medium px-4 py-3">User</th>
                        <th className="text-left font-medium px-4 py-3">Amount (MYR)</th>
                        <th className="text-left font-medium px-4 py-3">Status</th>
                        <th className="text-left font-medium px-4 py-3">Method</th>
                        <th className="text-left font-medium px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                      {filteredPayments.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">
                            {String(p.id).slice(0, 8)}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {p.userName || "—"}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {Number(p.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                STATUS_STYLES[p.status] || STATUS_STYLES.pending
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">
                            {p.paymentMethod || "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                            {p.createdAt
                              ? new Date(p.createdAt).toLocaleDateString("en-MY", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {paymentsTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-neutral-800">
                    <p className="text-xs text-gray-400">
                      Page {paymentsPage} of {paymentsTotalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}
                        disabled={paymentsPage <= 1}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPaymentsPage((p) => Math.min(paymentsTotalPages, p + 1))}
                        disabled={paymentsPage >= paymentsTotalPages}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "payouts" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            {selectedPayouts.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {selectedPayouts.length} payout{selectedPayouts.length !== 1 ? "s" : ""} selected
                </p>
                <button
                  onClick={() => handleMarkPaid(selectedPayouts)}
                  disabled={markingPaid}
                  className="px-4 py-2 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {markingPaid ? "Processing..." : "Mark Selected as Paid"}
                </button>
              </div>
            )}

            {loadingPayouts ? (
              <div className="p-8">
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            ) : filteredPayouts.length === 0 ? (
              <div className="text-center py-16">
                <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  No payouts found
                </h3>
                <p className="text-sm text-gray-500">
                  {search ? "Try adjusting your search" : "No pending payouts"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="text-left font-medium px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={
                              filteredPayouts.filter((p) => p.status === "pending").length > 0 &&
                              filteredPayouts
                                .filter((p) => p.status === "pending")
                                .every((p) => selectedPayouts.includes(Number(p.id)))
                            }
                            onChange={toggleAllPayouts}
                            className="rounded border-gray-300 text-rose-500 focus:ring-rose-400"
                          />
                        </th>
                        <th className="text-left font-medium px-4 py-3">ID</th>
                        <th className="text-left font-medium px-4 py-3">User</th>
                        <th className="text-left font-medium px-4 py-3">Amount</th>
                        <th className="text-left font-medium px-4 py-3">Commission</th>
                        <th className="text-left font-medium px-4 py-3">Net Amount</th>
                        <th className="text-left font-medium px-4 py-3">Status</th>
                        <th className="text-left font-medium px-4 py-3">Date</th>
                        <th className="text-left font-medium px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                      {filteredPayouts.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            {p.status === "pending" && (
                              <input
                                type="checkbox"
                                checked={selectedPayouts.includes(Number(p.id))}
                                onChange={() => togglePayoutSelection(Number(p.id))}
                                className="rounded border-gray-300 text-rose-500 focus:ring-rose-400"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-500">
                            {String(p.id).slice(0, 8)}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {p.userName || "—"}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            MYR {Number(p.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            MYR {Number(p.commission).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            MYR {Number(p.netAmount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                STATUS_STYLES[p.status] || STATUS_STYLES.pending
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                            {p.createdAt
                              ? new Date(p.createdAt).toLocaleDateString("en-MY", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {p.status === "pending" && (
                              <button
                                onClick={() => handleMarkPaid([Number(p.id)])}
                                disabled={markingPaid}
                                className="px-3 py-1.5 bg-rose-500 text-white text-xs font-semibold rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Mark as Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {payoutsTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-neutral-800">
                    <p className="text-xs text-gray-400">
                      Page {payoutsPage} of {payoutsTotalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPayoutsPage((p) => Math.max(1, p - 1))}
                        disabled={payoutsPage <= 1}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPayoutsPage((p) => Math.min(payoutsTotalPages, p + 1))}
                        disabled={payoutsPage >= payoutsTotalPages}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
