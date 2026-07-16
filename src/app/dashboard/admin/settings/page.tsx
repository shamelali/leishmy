"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings, Bell, Shield, Globe, ArrowLeft, Save, Loader2 } from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";
import { useTranslations } from "next-intl";

export default function AdminSettings() {
  const t = useTranslations("dashboard");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    platform_name: "",
    support_email: "",
    commission_rate: "",
  });
  const [notifications, setNotifications] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/admin?action=settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.settings) {
          setForm({
            platform_name: data.settings.platform_name || "",
            support_email: data.settings.support_email || "",
            commission_rate: data.settings.commission_rate || "",
          });
          try {
            setNotifications(JSON.parse(data.settings.notifications || "{}"));
          } catch {
            setNotifications({});
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/admin?action=settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...form,
            notifications: JSON.stringify(notifications),
          },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { console.error("Failed to save settings"); }
    setSaving(false);
  };

  if (loading) {
    return <DashboardLoading fullPage />;
  }

  const notifLabels = [
    "new_user", "new_artist", "new_booking", "payment_received", "report_submitted",
  ];
  const notifKeyMap: Record<string, string> = {
    new_user: "notifNewUser",
    new_artist: "notifNewArtist",
    new_booking: "notifNewBooking",
    payment_received: "notifPaymentReceived",
    report_submitted: "notifReportSubmitted",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('backToDashboard')}
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('settings.title')}</h1>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('settings.general')}</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('settings.platformName')}</label>
                <input value={form.platform_name} onChange={(e) => setForm({ ...form, platform_name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('settings.supportEmail')}</label>
                <input type="email" value={form.support_email} onChange={(e) => setForm({ ...form, support_email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('settings.commissionRate')}</label>
                <input type="number" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('settings.notifications')}</h2>
            </div>
            <div className="space-y-3">
              {notifLabels.map((key) => (
                <label key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{t('settings.' + notifKeyMap[key])}</span>
                  <input
                    type="checkbox"
                    checked={notifications[key] ?? true}
                    onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                    className="rounded text-rose-500 focus:ring-rose-400"
                  />
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? t('settings.saved') : t('settings.saveSettings')}
          </button>
        </form>
    </div>
  );
}
