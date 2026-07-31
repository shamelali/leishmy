"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Calendar, Clock, MapPin, Send, AlertCircle, CheckCircle,
  BarChart3, Users, DollarSign, Package, Settings, Share2,
} from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";
import { QuoteModal } from "@/components/QuoteModal";
import { useAuth } from "@/context/AuthContext";

interface Booking {
  id: string;
  client?: string;
  userName?: string;
  clientEmail?: string;
  service?: string;
  date?: string;
  time?: string;
  location?: string;
  status: string;
  amount?: number;
  createdAt?: string;
}

export default function StudioQuotes() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quoteModal, setQuoteModal] = useState<Booking | null>(null);
  const [filter, setFilter] = useState<"pending" | "sent">("pending");

  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/user/bookings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.bookings) setBookings(data.bookings);
      })
      .catch(() => setError("Failed to load bookings"))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const quotePending = bookings.filter((b) => b.status === "quote_pending");
  const quoteSent = bookings.filter((b) => b.status === "quote_sent");
  const visible = filter === "pending" ? quotePending : quoteSent;

  const handleQuoteSent = () => {
    if (!quoteModal) return;
    setBookings((prev) =>
      prev.map((b) => (b.id === quoteModal.id ? { ...b, status: "quote_sent" } : b))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/dashboard/studio"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">Quotes</h1>

      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-1">
        {[
          { href: "/dashboard/studio", label: "Overview", icon: BarChart3 },
          { href: "/dashboard/studio/quotes", label: "Quotes", icon: Send },
          { href: "/dashboard/studio/calendar", label: "Calendar", icon: Calendar },
          { href: "/dashboard/studio/staff", label: "Staff", icon: Users },
          { href: "/dashboard/studio/finance", label: "Finance", icon: DollarSign },
          { href: "/dashboard/studio/inventory", label: "Inventory", icon: Package },
          { href: "/dashboard/studio/edit", label: "Edit Profile", icon: Settings },
          { href: "/dashboard/studio/share", label: "Share & Refer", icon: Share2 },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              href === "/dashboard/studio/quotes"
                ? "bg-rose-500 text-white shadow-sm"
                : "bg-white dark:bg-neutral-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </Link>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-neutral-800 rounded-lg p-0.5 mb-6">
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            filter === "pending"
              ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Pending ({quotePending.length})
        </button>
        <button
          onClick={() => setFilter("sent")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            filter === "sent"
              ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sent ({quoteSent.length})
        </button>
      </div>

      {error ? (
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-red-300 dark:text-red-600 mx-auto mb-4" />
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      ) : loading ? (
        <DashboardLoading />
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">
            {filter === "pending"
              ? "No pending quote requests"
              : "No quotes sent yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((b) => (
            <div
              key={b.id}
              className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {b.client || b.userName || "Anonymous"}
                    </span>
                    {b.status === "quote_pending" ? (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full">
                        Awaiting Quote
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-full">
                        Quote Sent
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {b.service || "Beauty Service"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    {b.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(b.date).toLocaleDateString("en-MY", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    {b.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {b.time}
                      </span>
                    )}
                    {b.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {b.location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {b.status === "quote_pending" && (
                    <button
                      onClick={() => setQuoteModal(b)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 transition-all shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Quote
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {quoteModal && (
        <QuoteModal
          bookingId={quoteModal.id}
          serviceName={quoteModal.service || "Beauty Service"}
          clientName={quoteModal.client || quoteModal.userName || "Customer"}
          onClose={() => setQuoteModal(null)}
          onSuccess={handleQuoteSent}
        />
      )}
    </div>
  );
}
