"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Rule {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  active: boolean;
}

interface Override {
  id: number;
  date: string;
  unavailable: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DURATIONS = [30, 45, 60, 90, 120];

export default function AvailabilityTab() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newOverride, setNewOverride] = useState({ date: "", reason: "", unavailable: true });
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, overridesRes] = await Promise.all([
        fetch("/api/availability?userId=me"),
        fetch("/api/availability/overrides"),
      ]);
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(data.rules || []);
      }
      if (overridesRes.ok) {
        const data = await overridesRes.json();
        setOverrides(data.overrides || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchData();
    }
  }, [fetchData]);

  const toggleDay = (dayOfWeek: number) => {
    const existing = rules.find((r) => r.dayOfWeek === dayOfWeek);
    if (existing) {
      setRules(rules.filter((r) => r.dayOfWeek !== dayOfWeek));
    } else {
      setRules([
        ...rules,
        {
          id: 0,
          dayOfWeek,
          startTime: "09:00",
          endTime: "17:00",
          slotDurationMinutes: 60,
          active: true,
        },
      ]);
    }
  };

  const updateRule = (dayOfWeek: number, field: string, value: string | number | boolean) => {
    setRules(
      rules.map((r) =>
        r.dayOfWeek === dayOfWeek ? { ...r, [field]: value } : r
      )
    );
  };

  const saveRules = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: rules.map(({ dayOfWeek, startTime, endTime, slotDurationMinutes }) => ({ dayOfWeek, startTime, endTime, slotDurationMinutes })) }),
      });
      if (res.ok) {
        const data = await res.json();
        // Fetch updated rules to get proper IDs
        const rulesRes = await fetch("/api/availability?userId=me");
        if (rulesRes.ok) {
          const rd = await rulesRes.json();
          setRules(rd.rules || []);
        }
        setMessage({ type: "success", text: "Availability saved!" });
      } else {
        setMessage({ type: "error", text: "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const addOverride = async () => {
    if (!newOverride.date) return;
    setSaving(true);
    try {
      const res = await fetch("/api/availability/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newOverride.date, unavailable: true, reason: newOverride.reason }),
      });
      if (res.ok) {
        const overridesRes = await fetch("/api/availability/overrides");
        if (overridesRes.ok) {
          const data = await overridesRes.json();
          setOverrides(data.overrides || []);
        }
        setNewOverride({ date: "", reason: "", unavailable: true });
        setMessage({ type: "success", text: "Date blocked" });
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteOverride = async (id: number) => {
    try {
      const res = await fetch("/api/availability/overrides", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrideId: id }),
      });
      if (res.ok) {
        setOverrides(overrides.filter((o) => o.id !== id));
      }
    } catch { /* ignore */ }
  };

  const calDays = getCalendarDays(calendarMonth.year, calendarMonth.month);
  const overrideDates = new Set(overrides.map((o) => o.date?.slice(0, 10)));

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Weekly Schedule */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Weekly Schedule</h3>
          </div>
          <button
            onClick={saveRules}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 disabled:opacity-40 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-neutral-800">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const rule = rules.find((r) => r.dayOfWeek === day);
            const isActive = !!rule;

            return (
              <div
                key={day}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3 transition-colors ${
                  isActive ? "bg-rose-50/50 dark:bg-rose-950/10" : ""
                }`}
              >
                <div className="flex items-center gap-3 sm:w-36">
                  <button
                    onClick={() => toggleDay(day)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      isActive ? "bg-rose-500" : "bg-gray-300 dark:bg-neutral-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        isActive ? "translate-x-4.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{DAY_LABELS[day]}</p>
                  </div>
                </div>

                {isActive && rule && (
                  <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                    <input
                      type="time"
                      value={rule.startTime}
                      onChange={(e) => updateRule(day, "startTime", e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <input
                      type="time"
                      value={rule.endTime}
                      onChange={(e) => updateRule(day, "endTime", e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <select
                      value={rule.slotDurationMinutes}
                      onChange={(e) => updateRule(day, "slotDurationMinutes", Number(e.target.value))}
                      className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                    >
                      {DURATIONS.map((d) => (
                        <option key={d} value={d}>{d} min</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Block Dates */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Block Dates</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Block specific dates when you&apos;re unavailable (holidays, events, etc.)</p>
        </div>

        <div className="p-5">
          {/* Mini calendar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setCalendarMonth((m) => prevMonth(m.year, m.month))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              <button onClick={() => setCalendarMonth((m) => nextMonth(m.year, m.month))} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-gray-400 mb-1">
              {DAY_NAMES.map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calDays.map((d, i) => {
                if (!d) return <div key={`empty-${i}`} />;
                const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const isBlocked = overrideDates.has(dateStr);
                const isToday = new Date().toISOString().slice(0, 10) === dateStr;
                return (
                  <button
                    key={d}
                    onClick={() => {
                      if (isBlocked) {
                        const ov = overrides.find((o) => o.date?.slice(0, 10) === dateStr);
                        if (ov) deleteOverride(ov.id);
                      } else {
                        setNewOverride({ ...newOverride, date: dateStr });
                      }
                    }}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      isBlocked
                        ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                        : isToday
                        ? "bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual block form */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={newOverride.date}
              onChange={(e) => setNewOverride({ ...newOverride, date: e.target.value })}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <input
              type="text"
              placeholder="Reason (optional)"
              value={newOverride.reason}
              onChange={(e) => setNewOverride({ ...newOverride, reason: e.target.value })}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <button
              onClick={addOverride}
              disabled={!newOverride.date || saving}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-40 transition-all"
            >
              <Plus className="w-4 h-4" /> Block
            </button>
          </div>

          {/* Blocked dates list */}
          {overrides.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {overrides.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-3 py-2 bg-red-50 dark:bg-red-950/20 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(o.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    {o.reason && <p className="text-xs text-gray-500">{o.reason}</p>}
                  </div>
                  <button onClick={() => deleteOverride(o.id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function prevMonth(year: number, month: number) {
  return month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
}

function nextMonth(year: number, month: number) {
  return month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
}
