"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Sparkles, Edit2, Trash2, ArrowLeft } from "lucide-react";

const sampleServices = [
  { id: 1, name: "Bridal Makeup", duration: "2 hrs", price: 800, popular: true },
  { id: 2, name: "Evening Glam", duration: "1.5 hrs", price: 450, popular: true },
  { id: 3, name: "Natural Look", duration: "1 hr", price: 250, popular: false },
];

export default function ArtistServices() {
  const [services, setServices] = useState(sampleServices);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", duration: "", price: "" });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setServices([...services, { id: Date.now(), name: form.name, duration: form.duration, price: Number(form.price), popular: false }]);
    setForm({ name: "", duration: "", price: "" });
    setShowForm(false);
  };

  const handleDelete = (id: number) => {
    setServices(services.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/artist" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services</h1>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600">
            <Plus className="w-4 h-4" /> Add Service
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 mb-6 space-y-3">
            <input placeholder="Service name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" required />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Duration (e.g. 2 hrs)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" required />
              <input type="number" placeholder="Price (MYR)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" required />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {services.map((s) => (
            <div key={s.id} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {s.name}
                    {s.popular && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full">Popular</span>}
                  </p>
                  <p className="text-xs text-gray-400">{s.duration} &middot; MYR {s.price}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
