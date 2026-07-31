"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  MapPin,
} from "lucide-react";

interface Booking {
  id: string;
  artistId?: string;
  artistName?: string;
  client?: string;
  userName?: string;
  clientEmail?: string;
  clientPhone?: string;
  service?: string;
  date?: string;
  time?: string;
  price?: number;
  amount?: number;
  location?: string;
  status: string;
  createdAt?: string;
}

interface BookingsTabProps {
  bookings: Booking[];
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
    case "quote_pending":
      return "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400";
    case "confirmed":
      return "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400";
    case "completed":
      return "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400";
    case "cancelled":
      return "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-neutral-700";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "quote_pending":
      return "Quote Pending";
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export default function BookingsTab({ bookings, onConfirm, onReject }: BookingsTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const statusMap: Record<string, string[]> = {
    all: ["quote_pending", "pending", "confirmed", "completed", "cancelled"],
    upcoming: ["quote_pending", "pending", "confirmed"],
    completed: ["completed"],
    cancelled: ["cancelled"],
  };

  const filteredBookings = bookings.filter((b) => statusMap[filter]?.includes(b.status) ?? true);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      if (b.date) {
        const d = new Date(b.date).toISOString().split("T")[0];
        if (!map[d]) map[d] = [];
        map[d].push(b);
      }
    });
    return map;
  }, [bookings]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [firstDay, daysInMonth]);

  const selectedDateBookings = selectedDate ? bookingsByDate[selectedDate] || [] : [];

  const pendingCount = bookings.filter(
    (b) => b.status === "pending" || b.status === "quote_pending",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {pendingCount > 0
            ? `You have ${pendingCount} pending booking${pendingCount > 1 ? "s" : ""}`
            : "All caught up!"}
        </p>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1))}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h2 className="font-bold text-gray-900 dark:text-white">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1))}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div key={day} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayBookings = bookingsByDate[dateStr] || [];
            const hasBookings = dayBookings.length > 0;
            const hasPending = dayBookings.some((b) => b.status === "pending" || b.status === "quote_pending");
            const isToday = new Date().toISOString().split("T")[0] === dateStr;
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all ${
                  isSelected
                    ? "bg-rose-500 text-white font-bold"
                    : isToday
                      ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
                }`}
              >
                {day}
                {hasBookings && (
                  <span
                    className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                      hasPending
                        ? "bg-amber-500"
                        : isSelected
                          ? "bg-white"
                          : "bg-rose-500"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date bookings */}
      {selectedDate && selectedDateBookings.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">
            Bookings on {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </h3>
          <div className="space-y-3">
            {selectedDateBookings.map((b) => (
              <BookingCard key={b.id} booking={b} onConfirm={onConfirm} onReject={onReject} />
            ))}
          </div>
        </div>
      )}

      {/* Filter + List */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
        <div className="p-4 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex gap-1 bg-gray-100 dark:bg-neutral-800 rounded-lg p-0.5 overflow-x-auto">
            {(["all", "upcoming", "completed", "cancelled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                  filter === f
                    ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-neutral-800">
          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No bookings found</div>
          ) : (
            filteredBookings.slice(0, 20).map((b) => (
              <BookingCard key={b.id} booking={b} onConfirm={onConfirm} onReject={onReject} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  onConfirm,
  onReject,
}: {
  booking: Booking;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm">
            {booking.client || booking.userName || "Anonymous"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{booking.service}</p>
        </div>
        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full ${getStatusColor(booking.status)}`}>
          {getStatusLabel(booking.status)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        {booking.date && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {booking.date} {booking.time || ""}
          </span>
        )}
        {booking.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {booking.location}
          </span>
        )}
        {(booking.price || booking.amount) && (
          <span className="font-semibold text-gray-900 dark:text-white">
            RM {booking.price || booking.amount}
          </span>
        )}
      </div>
      {(booking.status === "pending" || booking.status === "quote_pending") && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onConfirm(booking.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> Confirm
          </button>
          <button
            onClick={() => onReject(booking.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}
