"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, CheckCircle, XCircle, RefreshCw, ArrowLeft, AlertTriangle } from "lucide-react";

const reports = [
  { id: 1, type: "artist", from: "Nurul H.", target: "Aiko Nakamura", reason: "No-show for appointment", status: "pending", date: "2026-06-28" },
  { id: 2, type: "client", from: "Studio Admin", target: "User #1024", reason: "Inappropriate behavior", status: "resolved", date: "2026-06-25" },
];

export default function AdminModeration() {
  const [items, setItems] = useState(reports);

  const handleResolve = (id: number) => {
    setItems(items.map((r) => (r.id === id ? { ...r, status: "resolved" } : r)));
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Moderation</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">All Clear</h3>
            <p className="text-sm text-gray-500">No reports needing review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <div key={r.id} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${r.type === "artist" ? "bg-violet-100 dark:bg-violet-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                      {r.type === "artist" ? <AlertTriangle className="w-4 h-4 text-violet-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Report {r.type} &mdash; {r.target}
                      </p>
                      <p className="text-xs text-gray-400">Reported by {r.from} &middot; {r.date}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize ${
                    r.status === "resolved" ? "bg-green-50 text-green-600 dark:bg-green-950/30" : "bg-amber-50 text-amber-600 dark:bg-amber-950/30"
                  }`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{r.reason}</p>
                {r.status === "pending" && (
                  <button onClick={() => handleResolve(r.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
                    <CheckCircle className="w-3.5 h-3.5" /> Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
