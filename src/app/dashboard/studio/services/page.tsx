"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Package, Plus, Pencil, Trash2, Star, X } from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { studioItems } from "@/components/dashboard/studioNav";
import { useAuth } from "@/context/AuthContext";

interface Service {
  id: number;
  name: string;
  description: string | null;
  duration: string | null;
  price: string;
  category: string;
  popular: boolean;
  createdAt: string;
}

interface ServicePackage {
  id: number;
  serviceId: number;
  name: string;
  description: string | null;
  price: string;
  includes: string[];
  duration: string | null;
  popular: boolean;
  sortOrder: number;
}

const emptyForm = { name: "", description: "", duration: "", price: "", category: "event" };

export default function StudioServices() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPkgForm, setShowPkgForm] = useState<number | null>(null);
  const [pkgForm, setPkgForm] = useState({ name: "", price: "", includes: "" });
  const [savingPkg, setSavingPkg] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/services?studioId=${user.id}`);
      const data = await res.json();
      setServices(data.services || []);
      const pkgRes = await fetch(`/api/services/packages?studioId=${user.id}`);
      const pkgData = await pkgRes.json();
      setPackages(pkgData.packages || []);
    } catch {
      setError("Failed to load services");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [user?.id, loadData]);

  const handleSave = async () => {
    if (!form.name.trim() || !user?.id) return;
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await fetch("/api/services", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...form, price: form.price || "0" }),
        });
      } else {
        await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studioId: user.id, ...form, price: form.price || "0" }),
        });
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await loadData();
    } catch {
      setError("Failed to save service");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this service?")) return;
    try {
      await fetch(`/api/services?id=${id}`, { method: "DELETE" });
      await loadData();
    } catch {
      setError("Failed to delete service");
    }
  };

  const handleEdit = (svc: Service) => {
    setForm({
      name: svc.name,
      description: svc.description || "",
      duration: svc.duration || "",
      price: svc.price,
      category: svc.category || "event",
    });
    setEditingId(svc.id);
    setShowForm(true);
  };

  const handleAddPackage = async (serviceId: number) => {
    if (!pkgForm.name.trim() || !pkgForm.price) return;
    setSavingPkg(true);
    try {
      await fetch("/api/services/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          name: pkgForm.name,
          price: pkgForm.price,
          includes: pkgForm.includes ? pkgForm.includes.split(",").map((s) => s.trim()) : [],
        }),
      });
      setPkgForm({ name: "", price: "", includes: "" });
      setShowPkgForm(null);
      await loadData();
    } catch {
      setError("Failed to save package");
    }
    setSavingPkg(false);
  };

  const handleDeletePackage = async (id: number) => {
    if (!confirm("Delete this package?")) return;
    try {
      await fetch(`/api/services/packages?id=${id}`, { method: "DELETE" });
      await loadData();
    } catch {
      setError("Failed to delete package");
    }
  };

  const activeId = studioItems.find((item) => pathname === item.href)?.id || "overview";

  return (
    <DashboardSidebar items={studioItems} activeId={activeId}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setForm(emptyForm);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-6 p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {editingId ? "Edit Service" : "New Service"}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                placeholder="Service name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white"
                required
              />
              <input
                placeholder="Price (MYR)"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white"
              />
              <input
                placeholder="Duration (e.g. 2 hours)"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white"
              >
                <option value="event">Event</option>
                <option value="wedding">Wedding</option>
                <option value="editorial">Editorial</option>
                <option value="commercial">Commercial</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
              </select>
              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="sm:col-span-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white resize-none"
                rows={2}
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:bg-rose-400 transition-colors"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <DashboardLoading />
        ) : services.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No services yet. Add your first service above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((svc) => {
              const svcPackages = packages.filter((p) => p.serviceId === svc.id);
              return (
                <div key={svc.id} className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{svc.name}</h3>
                        {svc.popular && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                      </div>
                      {svc.description && <p className="text-sm text-gray-500 mt-1">{svc.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>MYR {Number(svc.price).toLocaleString()}</span>
                        {svc.duration && <span>{svc.duration}</span>}
                        <span className="capitalize px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded-full">{svc.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button onClick={() => handleEdit(svc)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(svc.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {svcPackages.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800">
                      <p className="text-xs font-medium text-gray-400 mb-2">Packages</p>
                      <div className="flex flex-wrap gap-2">
                        {svcPackages.map((pkg) => (
                          <div key={pkg.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-neutral-800 rounded-lg text-xs">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{pkg.name}</span>
                            <span className="text-gray-400">MYR {Number(pkg.price).toLocaleString()}</span>
                            <button onClick={() => handleDeletePackage(pkg.id)} className="text-gray-400 hover:text-red-500">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {showPkgForm === svc.id ? (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800 space-y-2">
                      <div className="flex gap-2">
                        <input
                          placeholder="Package name"
                          value={pkgForm.name}
                          onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-xs"
                        />
                        <input
                          placeholder="Price"
                          type="number"
                          value={pkgForm.price}
                          onChange={(e) => setPkgForm({ ...pkgForm, price: e.target.value })}
                          className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-xs"
                        />
                        <button
                          onClick={() => handleAddPackage(svc.id)}
                          disabled={savingPkg}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500 text-white hover:bg-rose-600 disabled:bg-rose-400"
                        >
                          {savingPkg ? "..." : "Add"}
                        </button>
                        <button onClick={() => setShowPkgForm(null)} className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        placeholder="Includes (comma-separated)"
                        value={pkgForm.includes}
                        onChange={(e) => setPkgForm({ ...pkgForm, includes: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-xs"
                      />
                    </div>
                  ) : (
                    <button onClick={() => setShowPkgForm(svc.id)} className="mt-2 text-xs text-rose-500 hover:text-rose-600 font-medium">
                      + Add Package
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardSidebar>
  );
}
