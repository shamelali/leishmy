"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users, ChevronLeft, Search, MapPin, Star, BadgeCheck, Building2,
  Palette, Shield, User as UserIcon,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardLoading } from "@/components/DashboardLoading";

interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  image: string;
  role: string;
  status: string;
  verified: boolean;
  available: boolean;
  rating: string;
  reviewCount: number;
  slug: string;
  createdAt: string;
}

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "artist", label: "Artist" },
  { value: "studio", label: "Studio" },
  { value: "customer", label: "Customer" },
  { value: "admin", label: "Admin" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending_verification", label: "Pending verification" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    artist: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
    studio: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    admin: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
    customer: "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[role] || styles.customer}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-300",
    pending_verification: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    verified: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
    rejected: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchError("");
      try {
        const params = new URLSearchParams({ action: "people", pageSize: "100" });
        if (roleFilter) params.set("role", roleFilter);
        if (statusFilter) params.set("status", statusFilter);
        const res = await fetch(`/api/admin?${params.toString()}`);
        if (!res.ok) {
          if (!cancelled) {
            setFetchError("Failed to load people");
            setLoading(false);
          }
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setPeople(data.people || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setFetchError("Failed to load people");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roleFilter, statusFilter]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return people;
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term),
    );
  }, [people, search]);

  if (loading) {
    return <DashboardLoading fullPage />;
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-rose-500 transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <Users className="w-7 h-7 text-rose-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">People</h1>
                <p className="text-sm text-gray-500">Everyone on the platform, in one place</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:ring-2 focus:ring-rose-400"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:ring-2 focus:ring-rose-400"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {fetchError ? (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
              <p className="text-sm text-gray-500">{fetchError}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No people found</h3>
              <p className="text-sm text-gray-500">Try adjusting your filters or search</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[760px]">
                  <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="text-left font-medium px-4 py-3">Person</th>
                      <th className="text-left font-medium px-4 py-3">Contact</th>
                      <th className="text-left font-medium px-4 py-3">Role</th>
                      <th className="text-left font-medium px-4 py-3">Status</th>
                      <th className="text-left font-medium px-4 py-3">Rating</th>
                      <th className="text-left font-medium px-4 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white truncate">{p.name || "—"}</span>
                                {p.verified && <BadgeCheck className="w-4 h-4 text-green-500 shrink-0" />}
                              </div>
                              {p.slug && <span className="text-xs text-gray-400">/{p.slug}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-700 dark:text-gray-300">{p.email}</div>
                          {p.phone && <div className="text-xs text-gray-400">{p.phone}</div>}
                          {p.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <MapPin className="w-3 h-3" /> {p.location}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3"><RoleBadge role={p.role} /></td>
                        <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                            {Number(p.rating).toFixed(1)}
                            <span className="text-xs text-gray-400">({p.reviewCount})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100 dark:border-neutral-800">
                {filtered.length} {filtered.length === 1 ? "person" : "people"}
                {search && ` (filtered from ${people.length})`}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
