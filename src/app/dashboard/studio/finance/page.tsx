"use client";

import Link from "next/link";
import { DollarSign, TrendingUp, ArrowLeft, Wallet, Banknote, Download } from "lucide-react";

export default function StudioFinance() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/studio" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Finance</h1>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 bg-green-50 dark:bg-green-950/30 rounded-2xl border border-green-100 dark:border-green-900/50">
            <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-green-500" /><span className="text-xs font-medium text-green-600 dark:text-green-400">Total Revenue</span></div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">MYR 45,200</p>
            <p className="text-xs text-green-500 flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3" /> +15% this month</p>
          </div>
          <div className="p-5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/50">
            <div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-amber-500" /><span className="text-xs font-medium text-amber-600 dark:text-amber-400">Pending Payouts</span></div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">MYR 3,240</p>
          </div>
          <div className="p-5 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50">
            <div className="flex items-center gap-2 mb-2"><Banknote className="w-4 h-4 text-blue-500" /><span className="text-xs font-medium text-blue-600 dark:text-blue-400">Commission</span></div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">15%</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Transaction History</h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50"><Download className="w-3.5 h-3.5" /> Export</button>
          </div>
          <p className="text-sm text-gray-400">No transactions yet. Bookings with completed payments will appear here.</p>
        </div>
      </div>
    </div>
  );
}
