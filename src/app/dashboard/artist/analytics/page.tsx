"use client";

import Link from "next/link";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, ArrowLeft, Star } from "lucide-react";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const barHeights = months.map(() => `${40 + Math.random() * 60}%`);

const stats = [
  { icon: BarChart3, label: "Total Bookings", value: "47", change: "+12%", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { icon: DollarSign, label: "Revenue", value: "MYR 28,400", change: "+18%", color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
  { icon: Users, label: "New Clients", value: "23", change: "+8%", color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
  { icon: Star, label: "Avg. Rating", value: "4.9", change: "+0.1", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
];

export default function ArtistAnalytics() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/artist" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ icon: Icon, label, value, change, color, bg }) => (
            <div key={label} className={`p-5 ${bg} rounded-2xl border border-gray-100 dark:border-neutral-800`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3" /> {change} this month</p>
            </div>
          ))}
        </div>

        <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly Overview</h2>
          <div className="h-48 flex items-end justify-between gap-2">
            {months.map((month, i) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-rose-100 dark:bg-rose-950/30 rounded-t-lg" style={{ height: barHeights[i] }} />
                <span className="text-[10px] text-gray-400">{month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
