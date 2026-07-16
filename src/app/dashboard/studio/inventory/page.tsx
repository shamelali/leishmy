"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Plus, ArrowLeft, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardLoading } from "@/components/DashboardLoading";
import { useAuth } from "@/context/AuthContext";

export default function StudioInventory() {
  const t = useTranslations("dashboard");
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", quantity: "" });

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const profileRes = await fetch(`/api/user/studio-profile`);
        const profile = await profileRes.json();
        if (!profile?.studio?.id) return;
        const res = await fetch(`/api/inventory?studioId=${profile.studio.id}`);
        const data = await res.json();
        if (data?.items) setItems(data.items);
      } catch { console.error("Failed to load inventory"); }
      setLoading(false);
    })();
  }, [user?.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const profileRes = await fetch(`/api/user/studio-profile`);
    const profile = await profileRes.json();
    if (!profile?.studio?.id) return;

    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studioId: profile.studio.id,
        name: form.name,
        category: form.category,
        quantity: form.quantity || 0,
      }),
    });

    const data = await res.json();
    if (data?.item) {
      setItems([...items, data.item]);
      setForm({ name: "", category: "", quantity: "" });
      setShowForm(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/inventory?id=${id}`, { method: "DELETE" });
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/studio" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('backToDashboard')}
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('inventory.title')}</h1>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600">
            <Plus className="w-4 h-4" /> {t('inventory.addItem')}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 mb-6 space-y-3">
            <input placeholder={t('inventory.itemName')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" required />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder={t('inventory.categoryPlaceholder')} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" />
              <input type="number" placeholder={t('inventory.quantity')} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600">{t('save')}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">{t('cancel')}</button>
            </div>
          </form>
        )}

        {loading ? (
          <DashboardLoading />
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">{t('inventory.empty')}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">{t('inventory.tableItem')}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">{t('inventory.tableCategory')}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">{t('inventory.tableQty')}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">{t('inventory.tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
                {items.map((item) => {
                  const low = item.quantity <= (item.lowStockThreshold ?? 5);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 rounded-full">{item.category || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${low ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}>{item.quantity}</span>
                        {low && <span className="ml-1 text-[10px] text-red-500">{t('inventory.low')}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
