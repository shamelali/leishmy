"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { malaysiaStates, malaysiaDistricts } from "@/data/malaysia-locations";

const bridalTypes = ["Engagement", "Solemnization", "Reception", "Full Package (Engagement + Solemnization + Reception)"];
const nonBridalTypes = ["Dinner", "Graduation", "Ceremony", "Corporate", "Touch-up"];

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildRelativeDates() {
  const now = new Date();
  const today = new Date(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(today.getDate() + 1);

  const daysUntilSaturday = (6 - today.getDay() + 7) % 7;
  const thisSaturday = new Date(now);
  thisSaturday.setDate(today.getDate() + daysUntilSaturday);

  const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(today.getDate() + daysUntilMonday);

  const nextMonthFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const dates = [
    { label: "Today", value: toISO(today) },
    { label: "Tomorrow", value: toISO(tomorrow) },
    { label: "This Weekend", value: toISO(thisSaturday) },
    { label: "Next Week", value: toISO(nextMonday) },
    { label: "Next Month", value: toISO(nextMonthFirst) },
  ];
  return dates.filter((d, i, arr) => arr.findIndex((x) => x.value === d.value) === i);
}

type Props = {
  initialSearch: string;
  initialState: string;
  initialDistrict: string;
  initialEventCategory: string;
  initialEventType: string;
  initialEventTypeCustom: string;
  initialDate: string;
  currentCategory: string;
};

export default function ArtistSearchForm({
  initialSearch,
  initialState,
  initialDistrict,
  initialEventCategory,
  initialEventType,
  initialEventTypeCustom,
  initialDate,
  currentCategory,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [state, setState] = useState(initialState);
  const [district, setDistrict] = useState(initialDistrict);
  const [eventCategory, setEventCategory] = useState(initialEventCategory);
  const isCustomType =
    initialEventType &&
    !bridalTypes.includes(initialEventType) &&
    !nonBridalTypes.includes(initialEventType);
  const [eventType, setEventType] = useState(
    isCustomType ? "other" : initialEventType,
  );
  const [eventTypeCustom, setEventTypeCustom] = useState(
    isCustomType ? initialEventType : initialEventTypeCustom,
  );

  const relativeDates = buildRelativeDates();
  const matchedRelative = initialDate
    ? relativeDates.find((r) => r.value === initialDate)
    : null;
  const [dateSelect, setDateSelect] = useState(
    matchedRelative ? matchedRelative.value : initialDate ? "custom" : "",
  );
  const [date, setDate] = useState(initialDate);

  const districts = state ? malaysiaDistricts[state] || [] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (currentCategory) params.set("category", currentCategory);
    if (state) params.set("state", state);
    if (district) params.set("district", district);
    if (eventCategory) params.set("eventCategory", eventCategory);
    if (eventType) {
      params.set("eventType", eventType === "other" ? eventTypeCustom : eventType);
    }
    if (date) params.set("date", date);
    const qs = params.toString();
    router.push(qs ? `/artists?${qs}` : "/artists");
  };

  const clearAll = () => {
    if (currentCategory) {
      router.push(`/artists?category=${currentCategory}`);
    } else {
      router.push("/artists");
    }
  };

  const hasFilters = search || state || district || eventCategory || eventType || date;
  const showOtherInput = eventType === "other";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Search</label>
          <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-700 shadow-sm">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, style..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">State</label>
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setDistrict("");
            }}
            className="w-full px-4 py-3 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-700 text-sm text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <option value="">All States</option>
            {malaysiaStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Area/District</label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            disabled={!state}
            className="w-full px-4 py-3 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-700 text-sm text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-50"
          >
            <option value="">{state ? "All Districts" : "Select state first"}</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Date</label>
          <select
            value={dateSelect}
            onChange={(e) => {
              const val = e.target.value;
              setDateSelect(val);
              if (val === "custom") {
                setDate("");
              } else if (val) {
                setDate(val);
              } else {
                setDate("");
              }
            }}
            className="w-full px-4 py-3 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-700 text-sm text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <option value="">Any Date</option>
            {relativeDates.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
            <option value="custom">Choose Date...</option>
          </select>
          {dateSelect === "custom" && (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 w-full px-4 py-3 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-700 text-sm text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          )}
        </div>

        <button
          type="submit"
          className="px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-2xl transition-colors"
        >
          Filter
        </button>

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="px-4 py-3 text-sm text-gray-500 hover:text-rose-600 border border-gray-200 dark:border-neutral-700 rounded-2xl transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Event Type</label>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">Bridal</label>
            <select
              value={eventCategory === "bridal" ? eventType : ""}
              onChange={(e) => {
                setEventCategory("bridal");
                setEventType(e.target.value);
              }}
              className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 text-sm text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value="">Select Bridal Event</option>
              {bridalTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">Non-Bridal</label>
            <select
              value={eventCategory === "non-bridal" ? eventType : ""}
              onChange={(e) => {
                setEventCategory("non-bridal");
                setEventType(e.target.value);
              }}
              className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 text-sm text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <option value="">Select Non-Bridal Event</option>
              {nonBridalTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        {showOtherInput && (
          <div className="mt-2 max-w-xs">
            <input
              type="text"
              value={eventTypeCustom}
              onChange={(e) => setEventTypeCustom(e.target.value)}
              placeholder="Describe your event type..."
              className="w-full px-4 py-2 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        )}
      </div>
    </form>
  );
}
