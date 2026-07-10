"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CreditCard, CheckCircle, XCircle, Clock, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const statusIcon: Record<string, typeof CheckCircle> = {
  paid: CheckCircle,
  released: CheckCircle,
  pending: Clock,
  held: Clock,
  refunded: XCircle,
  failed: XCircle,
};

const statusColor: Record<string, string> = {
  paid: "text-green-600 bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/50",
  released: "text-green-600 bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/50",
  pending: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50",
  held: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50",
  refunded: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50",
  failed: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50",
};

export default function PaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/payments?action=history&userId=${user.id}`);
        const data = await res.json();
        if (data?.payments) setPayments(data.payments);
      } catch { console.error("Failed to load payments"); }
      setLoading(false);
    })();
  }, [user?.id]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Your payment history and billing information</p>
        </div>

        {!user ? (
          <div className="text-center py-16">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Sign in to view payments</h3>
            <p className="text-sm text-gray-500 mb-4">You need to be signed in to access payment information</p>
            <Link href="/login" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600">
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Methods</h2>
              <p className="text-sm text-gray-400">No payment methods saved yet. Payments are processed through Billplz at checkout.</p>
            </div>

            <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Payments</h2>
              {payments.length === 0 ? (
                <p className="text-sm text-gray-400">Payments will appear here after you complete a booking.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p: any) => {
                    const Icon = statusIcon[p.status] || Clock;
                    const colorClass = statusColor[p.status] || "text-gray-600 bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700";
                    return (
                      <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border ${colorClass}`}>
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold capitalize">{p.status}</p>
                            <p className="text-xs opacity-70">
                              {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : ""}
                              {p.artistName ? ` · ${p.artistName}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">MYR {Number(p.amount).toLocaleString()}</p>
                          {p.bookingId && (
                            <Link href={`/bookings/${p.bookingId}`} className="text-[10px] font-medium text-rose-500 hover:underline">
                              View Booking
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Need help with a payment? <Link href="/contact" className="font-medium underline">Contact support</Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
