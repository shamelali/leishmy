"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, X, Clock, User, Tag } from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { studioItems } from "@/components/dashboard/studioNav";
import { useAuth } from "@/context/AuthContext";
import { useStudioAuth } from "@/lib/auth/studio";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-red-400",
};

export default function StudioCalendar() {
  const { user } = useAuth();
  const { studioRole, isStudioUser, can } = useStudioAuth();
  const pathname = usePathname();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [studioId, setStudioId] = useState<string | null>(null);

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
        const profileRes = await fetch("/api/user/studio-profile");
        const profile = await profileRes.json();
        if (!profile?.studio?.id) return;
        setStudioId(profile.studio.id);
        const res = await fetch(`/api/calendar?studioId=${profile.studio.id}&month=${monthStr}`);
        const data = await res.json();
        if (data?.events) setEvents(data.events);
      } catch {
        setFetchError("Failed to load calendar events");
      }
      setLoading(false);
    })();
  }, [user?.id, monthStr]);

  const getEvents = (day: number) => events.filter((e) => e.day === day);

  const selectedEvents = selectedDay ? getEvents(selectedDay) : [];

  const activeId = studioItems.find((item) => pathname === item.href)?.id || "overview";

  return (
    <DashboardSidebar items={studioItems} activeId={activeId}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {fetchError ? (
          <p className="text-red-500 text-center py-16">{fetchError}</p>
        ) : loading ? (
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
                  onClick={() => dayEvents.length > 0 && setSelectedDay(day)}
                  className={`min-h-[90px] p-1.5 border-b border-r border-gray-50 dark:border-neutral-800 ${dayEvents.length > 0 ? "bg-rose-50/50 dark:bg-rose-950/10 cursor-pointer hover:bg-rose-100/50 dark:hover:bg-rose-950/30 transition-colors" : ""}`}
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

      {selectedDay !== null && selectedEvents.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-800 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {selectedDay} {monthLabel}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {selectedEvents.map((e: any) => (
                <div key={e.id} className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{e.time || "All day"}</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[e.status] || "bg-gray-400"}`} />
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      <span>{e.client}</span>
                    </div>
                    {e.artist && (
                      <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3" />
                        <span>{e.artist}</span>
                      </div>
                    )}
                    {e.amount && (
                      <p className="font-medium text-gray-700 dark:text-gray-300 mt-1">
                        MYR {Number(e.amount).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardSidebar>
  );
}
