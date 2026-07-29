"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, ArrowLeft, BadgeCheck, X, Plus } from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";
import { useAuth } from "@/context/AuthContext";

export default function StudioStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const loadStaff = async () => {
    if (!user?.id) return;
    try {
      const profileRes = await fetch("/api/user/studio-profile");
      const profile = await profileRes.json();
      if (!profile?.studio?.id) return;
      const res = await fetch(`/api/user/studio-staff?studioId=${profile.studio.id}`);
      const data = await res.json();
      if (data?.staff) setStaff(data.staff);
    } catch { console.error("Failed to load staff"); }
    setLoading(false);
  };

  useEffect(() => {
    if (!user?.id) return;
    loadStaff();
  }, [user?.id]);

  const handleAdd = async () => {
    if (!addEmail.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/user/add-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail.trim() }),
      });
      if (res.ok) {
        setAddEmail("");
        await loadStaff();
      } else {
        const err = await res.json();
        setError(err.error || "Failed to add staff");
      }
    } catch {
      setError("Network error");
    }
    setAdding(false);
  };

  const handleRemove = async (artistId: string) => {
    try {
      const res = await fetch("/api/user/remove-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId }),
      });
      if (res.ok) {
        setStaff((prev) => prev.filter((s) => s.id !== artistId));
      }
    } catch { console.error("Failed to remove staff"); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/dashboard/studio" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
      </div>

      <div className="mb-6 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Staff by Email</label>
        <div className="flex gap-2">
          <input
            type="email"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="artist@example.com"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !addEmail.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> {adding ? "Adding..." : "Add"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      {loading ? (
        <DashboardLoading />
      ) : staff.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No staff members yet. Add an artist by email above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((s: any) => (
            <div key={s.id} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/30"><Users className="w-5 h-5 text-violet-500" /></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                    {s.name} {s.verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                  </p>
                  <p className="text-xs text-gray-400">{s.location || "No location set"}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                    {s.email && <span>{s.email}</span>}
                    {s.phone && <span>{s.phone}</span>}
                    {s.rating !== "0" && <span>★ {s.rating}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRemove(s.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                title="Remove from staff"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
