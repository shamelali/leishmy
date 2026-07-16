"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Sparkles, Trash2, ArrowLeft } from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

export default function ArtistServices() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [artistId, setArtistId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", duration: "", price: "" });

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/user/artist-profile`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.artist?.id) {
          const id = Number(data.artist.id);
          setArtistId(id);
          return fetch(`/api/services?artistId=${id}`);
        }
        throw new Error("No artist profile");
      })
      .then((r) => r.json())
      .then((data) => {
        if (data?.services) setServices(data.services);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistId) return;

    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artistId,
        name: form.name,
        duration: form.duration,
        price: form.price,
      }),
    });

    const data = await res.json();
    if (data?.service) {
      setServices([...services, data.service]);
      setForm({ name: "", duration: "", price: "" });
      setShowForm(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/services?id=${id}`, { method: "DELETE" });
    setServices(services.filter((s) => s.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/artist" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('backToDashboard')}
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('services.title')}</h1>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600">
            <Plus className="w-4 h-4" /> {t('services.addService')}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 mb-6 space-y-3">
            <input placeholder={t('services.serviceName')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" required />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder={t('services.durationPlaceholder')} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" required />
              <input type="number" placeholder={t('services.pricePlaceholder')} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" required />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600">{t('save')}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">{t('cancel')}</button>
            </div>
          </form>
        )}

        {loading ? (
          <DashboardLoading />
        ) : services.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">{t('services.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((s: any) => (
              <div key={s.id} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30">
                    <Sparkles className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {s.name}
                      {s.popular && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full">{t('services.popular')}</span>}
                    </p>
                    <p className="text-xs text-gray-400">{s.duration} &middot; MYR {Number(s.price)}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
