"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Plus, Mail, Phone, Trash2, ArrowLeft, BadgeCheck } from "lucide-react";

const initialStaff = [
  { id: 1, name: "Aiko Nakamura", role: "Senior MUA", email: "aiko@studio.com", phone: "+60 12-345 6789", verified: true },
  { id: 2, name: "Sarah Ahmad", role: "MUA", email: "sarah@studio.com", phone: "+60 13-456 7890", verified: true },
];

export default function StudioStaff() {
  const [staff, setStaff] = useState(initialStaff);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", email: "", phone: "" });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setStaff([...staff, { ...form, id: Date.now(), verified: false }]);
    setForm({ name: "", role: "", email: "", phone: "" });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/studio" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 mb-6 space-y-3">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" required />
            <input placeholder="Role (e.g. Senior MUA)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" required />
            <div className="grid grid-cols-2 gap-3">
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" />
              <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {staff.map((s) => (
            <div key={s.id} className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/30"><Users className="w-5 h-5 text-violet-500" /></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                    {s.name} {s.verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                  </p>
                  <p className="text-xs text-gray-400">{s.role}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
