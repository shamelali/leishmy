"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Users, Clock, Calendar, Save } from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { studioItems } from "@/components/dashboard/studioNav";
import { useAuth } from "@/context/AuthContext";

interface Staff {
  id: string;
  name: string;
  email: string;
}

interface AvailabilityRule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  active: boolean;
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayNamesFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const defaultRule: Omit<AvailabilityRule, "dayOfWeek"> = {
  startTime: "09:00",
  endTime: "18:00",
  slotDurationMinutes: 60,
  active: true,
};

export default function StudioSchedules() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadStaff = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/user/studio-staff?studioId=${user.id}`);
      const data = await res.json();
      setStaff(data.staff || []);
    } catch {
      setError("Failed to load staff");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStaff();
  }, [user?.id, loadStaff]);

  const loadRules = async (staffId: string) => {
    try {
      const res = await fetch(`/api/availability?userId=${staffId}`);
      const data = await res.json();
      const existing: AvailabilityRule[] = data.rules || [];
      const allDays: AvailabilityRule[] = Array.from({ length: 7 }, (_, i) => {
        const found = existing.find((r) => r.dayOfWeek === i);
        return found || { dayOfWeek: i, ...defaultRule, active: false };
      });
      setRules(allDays);
    } catch {
      setError("Failed to load schedule");
    }
  };

  const handleSelectStaff = async (staffId: string) => {
    setSelectedStaff(staffId);
    setSuccess("");
    await loadRules(staffId);
  };

  const toggleDay = (day: number) => {
    setRules((prev) =>
      prev.map((r) => (r.dayOfWeek === day ? { ...r, active: !r.active } : r))
    );
  };

  const updateRule = (day: number, field: keyof AvailabilityRule, value: string | number | boolean) => {
    setRules((prev) =>
      prev.map((r) => (r.dayOfWeek === day ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const activeRules = rules
        .filter((r) => r.active)
        .map(({ dayOfWeek, startTime, endTime, slotDurationMinutes }) => ({
          dayOfWeek,
          startTime,
          endTime,
          slotDurationMinutes,
        }));
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: activeRules }),
      });
      if (res.ok) {
        setSuccess("Schedule saved!");
      } else {
        setError("Failed to save schedule");
      }
    } catch {
      setError("Failed to save schedule");
    }
    setSaving(false);
  };

  const activeId = studioItems.find((item) => pathname === item.href)?.id || "overview";

  return (
    <DashboardSidebar items={studioItems} activeId={activeId}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Staff Schedules</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-xl text-sm text-green-600 dark:text-green-400">
            {success}
          </div>
        )}

        {loading ? (
          <DashboardLoading />
        ) : staff.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No staff members. Add staff first to manage their schedules.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
              <p className="text-xs font-medium text-gray-400 mb-3">Select a staff member</p>
              <div className="flex flex-wrap gap-2">
                {staff.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStaff(s.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      selectedStaff === s.id
                        ? "bg-rose-500 text-white"
                        : "bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {selectedStaff && (
              <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Weekly Schedule
                  </h2>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-400 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>

                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div key={rule.dayOfWeek} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${rule.active ? "bg-gray-50 dark:bg-neutral-800" : "bg-gray-50/50 dark:bg-neutral-800/50 opacity-50"}`}>
                      <button
                        onClick={() => toggleDay(rule.dayOfWeek)}
                        className={`w-10 h-10 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                          rule.active
                            ? "bg-rose-500 text-white"
                            : "bg-gray-200 dark:bg-neutral-700 text-gray-500"
                        }`}
                      >
                        {dayNames[rule.dayOfWeek]}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">{dayNamesFull[rule.dayOfWeek]}</p>
                        {rule.active ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <input
                                type="time"
                                value={rule.startTime}
                                onChange={(e) => updateRule(rule.dayOfWeek, "startTime", e.target.value)}
                                className="px-2 py-1 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-gray-900 dark:text-white"
                              />
                            </div>
                            <span className="text-xs text-gray-400">to</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="time"
                                value={rule.endTime}
                                onChange={(e) => updateRule(rule.dayOfWeek, "endTime", e.target.value)}
                                className="px-2 py-1 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-gray-900 dark:text-white"
                              />
                            </div>
                            <select
                              value={rule.slotDurationMinutes}
                              onChange={(e) => updateRule(rule.dayOfWeek, "slotDurationMinutes", Number(e.target.value))}
                              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-gray-900 dark:text-white"
                            >
                              <option value={30}>30 min slots</option>
                              <option value={60}>1 hour slots</option>
                              <option value={90}>1.5 hour slots</option>
                              <option value={120}>2 hour slots</option>
                            </select>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">Unavailable</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardSidebar>
  );
}
