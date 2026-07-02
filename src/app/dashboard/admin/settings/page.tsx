"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, Bell, Shield, Globe, ArrowLeft, Save } from "lucide-react";

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">General</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Platform Name</label>
                <input defaultValue="Leish!" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Support Email</label>
                <input type="email" defaultValue="support@leish.my" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Commission Rate (%)</label>
                <input type="number" defaultValue="15" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h2>
            </div>
            <div className="space-y-3">
              {["New user registration", "New artist application", "New booking", "Payment received", "Report submitted"].map((n) => (
                <label key={n} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{n}</span>
                  <input type="checkbox" defaultChecked className="rounded text-rose-500 focus:ring-rose-400" />
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors">
            <Save className="w-4 h-4" /> {saved ? "Saved!" : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
