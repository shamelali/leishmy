"use client";

import Link from "next/link";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, ArrowLeft, Download } from "lucide-react";

export default function AdminReports() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50">
            <Download className="w-3.5 h-3.5" /> Export All
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Platform Growth</h3>
            <div className="space-y-3">
              {[
                { label: "New Users", value: "+89", change: "+12%", color: "text-blue-500" },
                { label: "New Artists", value: "+12", change: "+8%", color: "text-violet-500" },
                { label: "New Bookings", value: "+45", change: "+18%", color: "text-green-500" },
              ].map(({ label, value, change, color }) => (
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
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Revenue Summary</h3>
            <div className="space-y-3">
              {[
                { label: "This Month", value: "MYR 12,400" },
                { label: "Last Month", value: "MYR 10,800" },
                { label: "Commission Earned", value: "MYR 1,860" },
                { label: "Pending Payouts", value: "MYR 3,240" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Download Reports</h2>
          <div className="space-y-2">
            {["User Report", "Artist Report", "Booking Report", "Payment Report", "Revenue Report"].map((r) => (
              <div key={r} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500 text-white hover:bg-rose-600">
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
