"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Sparkles, Trash2, ArrowLeft, Hotel, AlertCircle, Edit2, X } from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";
import { useAuth } from "@/context/AuthContext";

export default function ArtistServices() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artistId, setArtistId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", duration: "", price: "", popular: false });
  const [accommodationFee, setAccommodationFee] = useState("");
  const [travelSurcharge, setTravelSurcharge] = useState("");
  const [savingFee, setSavingFee] = useState(false);

  const resetForm = () => {
    setForm({ name: "", duration: "", price: "", popular: false });
    setEditingId(null);
    setShowForm(false);
  };

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/user/artist-profile`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.artist?.id) {
          const id = String(data.artist.id);
          setArtistId(id);
          if (data.artist.accommodationFee !== undefined) {
            setAccommodationFee(String(data.artist.accommodationFee));
          }
          if (data.artist.travelSurcharge !== undefined) {
            setTravelSurcharge(String(data.artist.travelSurcharge));
          }
          return fetch(`/api/services?artistId=${id}`);
        }
        throw new Error("No artist profile");
      })
      .then((r) => r.json())
      .then((data) => {
        if (data?.services) setServices(data.services);
      })
      .catch(() => setError("Failed to load services"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistId) return;

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/services?id=${editingId}` : "/api/services";
    const body = editingId
      ? { id: editingId, ...form }
      : { artistId, ...form };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data?.service) {
      if (editingId) {
        setServices(services.map((s) => (s.id === editingId ? data.service : s)));
      } else {
        setServices([...services, data.service]);
      }
      resetForm();
    }
  };

  const handleEdit = (s: any) => {
    setForm({
      name: s.name,
      duration: s.duration || "",
      price: String(s.price),
      popular: s.popular || false,
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/services?id=${id}`, { method: "DELETE" });
    setServices(services.filter((s) => s.id !== id));
  };

  const handleSaveFees = async () => {
    if (!artistId) return;
    setSavingFee(true);
    try {
      const res = await fetch("/api/user/artist-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accommodationFee: Number(accommodationFee) || 0,
          travelSurcharge: Number(travelSurcharge) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch (err) {
      console.error(err);
      alert("Failed to save fees");
    } finally {
      setSavingFee(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/dashboard/artist" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 mb-6 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            {editingId ? "Edit Service" : "Add Service"}
          </h3>
          <input placeholder="Service name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" required />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Duration (e.g. 2 hrs)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" />
            <input type="number" placeholder="Price (MYR)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" min="0" step="0.01" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500" />
            Popular
          </label>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600">Save</button>
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {/* Fees Section */}
      <div className="mb-6 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <Hotel className="w-5 h-5 text-rose-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Fees</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Flat fees added when applicable. Included in deposit calculation.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Overnight Accommodation (MYR)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={accommodationFee}
              onChange={(e) => setAccommodationFee(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Out-of-Area Travel (MYR)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={travelSurcharge}
              onChange={(e) => setTravelSurcharge(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
              placeholder="0.00"
            />
          </div>
        </div>
        <button
          onClick={handleSaveFees}
          disabled={savingFee}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50"
        >
          {savingFee ? "Saving..." : "Save Fees"}
        </button>
      </div>

      {error ? (
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-red-300 dark:text-red-600 mx-auto mb-4" />
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      ) : loading ? (
        <DashboardLoading />
      ) : services.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No services yet. Add your first service above.</p>
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
                    {s.popular && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 rounded-full">Popular</span>}
                  </p>
                  <p className="text-xs text-gray-400">{s.duration ? `${s.duration} · ` : ""}{Number(s.price) > 0 ? `MYR ${Number(s.price)}` : "Negotiable"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(s)} className="p-2 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors" title="Edit">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
