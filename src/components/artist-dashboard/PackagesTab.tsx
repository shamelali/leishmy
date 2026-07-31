"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, Package, GripVertical } from "lucide-react";

interface ServicePackage {
  id: string;
  serviceId: number;
  name: string;
  description?: string;
  price: number;
  includes: string[];
  duration?: string;
  popular: boolean;
  active: boolean;
  sortOrder: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

interface PackagesTabProps {
  artistId: string;
  services: Service[];
}

export default function PackagesTab({ artistId, services }: PackagesTabProps) {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: "",
    description: "",
    price: "",
    includes: "",
    duration: "",
    popular: false,
  });

  async function fetchPackages() {
    try {
      const res = await fetch(`/api/services/packages?artistId=${artistId}`);
      const data = await res.json();
      setPackages(data.packages || []);
    } catch {
      console.error("Failed to fetch packages");
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddPackage() {
    if (!selectedService || !newPackage.name || !newPackage.price) return;

    setSaving(true);
    try {
      const includes = newPackage.includes
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/services/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: Number(selectedService),
          name: newPackage.name,
          description: newPackage.description || undefined,
          price: Number(newPackage.price),
          includes,
          duration: newPackage.duration || undefined,
          popular: newPackage.popular,
        }),
      });

      const data = await res.json();
      if (res.ok && data.package) {
        setPackages([...packages, { ...data.package, id: String(data.package.id) }]);
        setNewPackage({ name: "", description: "", price: "", includes: "", duration: "", popular: false });
        setShowAddForm(false);
      }
    } catch {
      console.error("Failed to add package");
    }
    setSaving(false);
  }

  async function handleDeletePackage(id: string) {
    try {
      const res = await fetch(`/api/services/packages?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPackages(packages.filter((p) => p.id !== id));
      }
    } catch {
      console.error("Failed to delete package");
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    try {
      const res = await fetch("/api/services/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(id), active: !active }),
      });

      if (res.ok) {
        setPackages(packages.map((p) => (p.id === id ? { ...p, active: !active } : p)));
      }
    } catch {
      console.error("Failed to update package");
    }
  }

  async function handleTogglePopular(id: string, popular: boolean) {
    try {
      const res = await fetch("/api/services/packages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(id), popular: !popular }),
      });

      if (res.ok) {
        setPackages(packages.map((p) => (p.id === id ? { ...p, popular: !popular } : p)));
      }
    } catch {
      console.error("Failed to update package");
    }
  }

  const groupedPackages = packages.reduce<Record<string, ServicePackage[]>>((acc, pkg) => {
    const serviceId = String(pkg.serviceId);
    if (!acc[serviceId]) acc[serviceId] = [];
    acc[serviceId].push(pkg);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Packages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create service packages with fixed pricing for customers to choose from
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Package
        </button>
      </div>

      {/* Add Package Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">New Package</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Service <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              >
                <option value="">Select a service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Base: RM {s.price})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Package Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                  placeholder="e.g. Basic, Premium, Deluxe"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Price (MYR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newPackage.price}
                  onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description (optional)
              </label>
              <input
                type="text"
                value={newPackage.description}
                onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                placeholder="Brief description of this package"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Includes (one per line)
              </label>
              <textarea
                value={newPackage.includes}
                onChange={(e) => setNewPackage({ ...newPackage, includes: e.target.value })}
                rows={3}
                placeholder="Makeup application&#10;False lashes&#10;Touch-up kit"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Duration (optional)
                </label>
                <input
                  type="text"
                  value={newPackage.duration}
                  onChange={(e) => setNewPackage({ ...newPackage, duration: e.target.value })}
                  placeholder="e.g. 2 hours"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPackage.popular}
                    onChange={(e) => setNewPackage({ ...newPackage, popular: e.target.checked })}
                    className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mark as Popular
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2.5 px-4 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPackage}
                disabled={!selectedService || !newPackage.name || !newPackage.price || saving}
                className="flex-1 py-2.5 px-4 bg-rose-500 text-white font-medium rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Packages List */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
          <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No packages yet</p>
          <p className="text-xs text-gray-400 mt-1">Create packages to offer customers fixed pricing options</p>
        </div>
      ) : (
        <div className="space-y-6">
          {services.map((service) => {
            const servicePkgs = groupedPackages[service.id] || [];
            if (servicePkgs.length === 0) return null;

            return (
              <div key={service.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{service.name}</h3>
                <div className="space-y-3">
                  {servicePkgs.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-4 rounded-xl border ${
                        pkg.active
                          ? "border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800"
                          : "border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/50 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">{pkg.name}</span>
                            {pkg.popular && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                          {pkg.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pkg.description}</p>
                          )}
                          {pkg.includes && pkg.includes.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {pkg.includes.map((item, i) => (
                                <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-rose-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className="font-bold text-gray-900 dark:text-white">RM {pkg.price}</span>
                          <button
                            onClick={() => handleTogglePopular(pkg.id, pkg.popular)}
                            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                              pkg.popular
                                ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400"
                                : "bg-gray-100 dark:bg-neutral-700 text-gray-500 hover:text-amber-600"
                            }`}
                          >
                            {pkg.popular ? "★ Popular" : "☆ Popular"}
                          </button>
                          <button
                            onClick={() => handleToggleActive(pkg.id, pkg.active)}
                            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                              pkg.active
                                ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400"
                                : "bg-gray-100 dark:bg-neutral-700 text-gray-500"
                            }`}
                          >
                            {pkg.active ? "Active" : "Inactive"}
                          </button>
                          <button
                            onClick={() => handleDeletePackage(pkg.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
