"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Tag,
  MessageSquare,
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
  notes?: string;
  travelSurcharge?: number;
  accommodationFee?: number;
  servicePrice?: number;
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
  const [showDetails, setShowDetails] = useState(false);

  const travelFee = Number(booking.travelSurcharge) || 0;
  const accomFee = Number(booking.accommodationFee) || 0;
  const serviceFee = Number(booking.servicePrice) || 0;
  const totalAmount = Number(booking.price || booking.amount) || 0;

  return (
    <>
      <div
        onClick={() => setShowDetails(true)}
        className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
      >
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
          {totalAmount > 0 && (
            <span className="font-semibold text-gray-900 dark:text-white">
              RM {totalAmount.toLocaleString()}
            </span>
          )}
        </div>
        {(booking.status === "pending" || booking.status === "quote_pending") && (
          <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
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

      {/* Booking Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetails(false)}>
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Booking Details</h2>
              <button onClick={() => setShowDetails(false)} className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Booking #{booking.id}</p>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  {getStatusLabel(booking.status)}
                </span>
              </div>

              {/* Client Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-rose-500" /> Client
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                    <p className="text-[10px] text-gray-400 mb-0.5">Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.client || booking.userName || "—"}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                    <p className="text-[10px] text-gray-400 mb-0.5">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{booking.clientEmail || "—"}</p>
                  </div>
                  {booking.clientPhone && (
                    <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                      <p className="text-[10px] text-gray-400 mb-0.5">Phone</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.clientPhone}</p>
                    </div>
                  )}
                  {booking.location && (
                    <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                      <p className="text-[10px] text-gray-400 mb-0.5">Location</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.location}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" /> Booking
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {booking.date && (
                    <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                      <p className="text-[10px] text-gray-400 mb-0.5">Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(booking.date).toLocaleDateString("en-MY", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                    </div>
                  )}
                  {booking.time && (
                    <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                      <p className="text-[10px] text-gray-400 mb-0.5">Time</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.time}</p>
                    </div>
                  )}
                  {booking.service && (
                    <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl col-span-2">
                      <p className="text-[10px] text-gray-400 mb-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Service
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.service}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-rose-500" /> Price Breakdown
                </h3>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl space-y-2">
                  {serviceFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Service fee</span>
                      <span className="font-medium text-gray-900 dark:text-white">RM {serviceFee.toLocaleString()}</span>
                    </div>
                  )}
                  {travelFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Travel surcharge</span>
                      <span className="font-medium text-gray-900 dark:text-white">+ RM {travelFee.toLocaleString()}</span>
                    </div>
                  )}
                  {accomFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Accommodation fee</span>
                      <span className="font-medium text-gray-900 dark:text-white">+ RM {accomFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t border-amber-200 dark:border-amber-900/50">
                    <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="font-bold text-gray-900 dark:text-white">RM {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-rose-500" /> Notes
                  </h3>
                  <div className="p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{booking.notes}</p>
                  </div>
                </div>
              )}

              {booking.createdAt && (
                <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-neutral-800">
                  <Tag className="w-3 h-3" />
                  <span>Created: {new Date(booking.createdAt).toLocaleDateString("en-MY", { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
