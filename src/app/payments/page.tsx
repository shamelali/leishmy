"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CreditCard, CheckCircle, XCircle, Clock, AlertCircle, ArrowRight } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import { useAuth } from "@/context/AuthContext";

export default function PaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-40 rounded-2xl mb-4" />
        <Skeleton className="h-40 rounded-2xl" />
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
              <p className="text-sm text-gray-400">Payments will appear here after you complete a booking.</p>
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
