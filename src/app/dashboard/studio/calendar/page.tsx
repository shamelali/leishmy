"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";
import { useAuth } from "@/context/AuthContext";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StudioCalendar() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const monthLabel = new Date(year, month).toLocaleString("default", { month: "long", year: "numeric" });
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      try {
        const profileRes = await fetch(`/api/user/studio-profile`);
        const profile = await profileRes.json();
        if (!profile?.studio?.id) return;
        const res = await fetch(`/api/calendar?studioId=${profile.studio.id}&month=${monthStr}`);
        const data = await res.json();
        if (data?.events) setEvents(data.events);
      } catch { console.error("Failed to load calendar events"); }
      setLoading(false);
    })();
  }, [user?.id, monthStr]);

  const getEvents = (day: number) => events.filter((e) => e.day === day);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/studio" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Calendar</h1>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-neutral-800">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="font-semibold text-gray-900 dark:text-white">{monthLabel}</h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800">
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {loading ? (
            <DashboardLoading />
          ) : (
            <div className="grid grid-cols-7">
              {DAYS.map((d) => (
                <div key={d} className="p-2 text-center text-xs font-medium text-gray-400 border-b border-gray-100 dark:border-neutral-800">{d}</div>
              ))}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`blank-${i}`} className="min-h-[90px] p-1.5 border-b border-r border-gray-50 dark:border-neutral-800" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dayEvents = getEvents(day);
                return (
                  <div
                    key={day}
                    className={`min-h-[90px] p-1.5 border-b border-r border-gray-50 dark:border-neutral-800 ${dayEvents.length > 0 ? "bg-rose-50/50 dark:bg-rose-950/10" : ""}`}
                  >
                    <span className={`text-xs font-medium ${dayEvents.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-gray-500"}`}>{day}</span>
                    {dayEvents.slice(0, 3).map((e: any) => (
                      <div key={e.id} className="mt-0.5 px-1 py-0.5 bg-rose-500 text-white rounded text-[9px] leading-tight truncate" title={`${e.time} ${e.client} - ${e.artist}`}>
                        {e.time} {e.client}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="mt-0.5 text-[8px] text-gray-400 text-center">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
}
