"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const events: Record<string, { time: string; client: string; artist: string }[]> = {
  "15": [{ time: "10:00", client: "Nurul Huda", artist: "Aiko" }],
  "18": [{ time: "14:00", client: "Farah Aminah", artist: "Sarah" }],
  "22": [{ time: "09:00", client: "Mei Ling", artist: "Aiko" }, { time: "15:00", client: "Siti", artist: "Sarah" }],
};

export default function StudioCalendar() {
  const [month, setMonth] = useState("July 2026");

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/studio" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Calendar</h1>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-neutral-800">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
            <h2 className="font-semibold text-gray-900 dark:text-white">{month}</h2>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"><ChevronRight className="w-5 h-5 text-gray-500" /></button>
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => (
              <div key={d} className="p-2 text-center text-xs font-medium text-gray-400 border-b border-gray-100 dark:border-neutral-800">{d}</div>
            ))}
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <div key={day} className={`min-h-[80px] p-1.5 border-b border-r border-gray-50 dark:border-neutral-800 ${events[day] ? "bg-rose-50/50 dark:bg-rose-950/10" : ""}`}>
                <span className={`text-xs font-medium ${events[day] ? "text-rose-600 dark:text-rose-400" : "text-gray-500"}`}>{day}</span>
                {events[day]?.map((e, i) => (
                  <div key={i} className="mt-0.5 px-1 py-0.5 bg-rose-500 text-white rounded text-[9px] leading-tight truncate">
                    {e.time} {e.client}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
