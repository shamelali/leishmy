"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, MapPin, Send, AlertCircle, CheckCircle } from "lucide-react";
import { QuoteModal } from "@/components/QuoteModal";

interface Booking {
  id: string;
  client?: string;
  userName?: string;
  clientEmail?: string;
  service?: string;
  serviceId?: number;
  date?: string;
  time?: string;
  location?: string;
  status: string;
  amount?: number;
  createdAt?: string;
}

interface PricingRules {
  weekendSurcharge?: number;
  holidaySurcharge?: number;
  lastMinuteSurcharge?: number;
  earlyBirdDiscount?: number;
  peakMonths?: number[];
}

export default function QuotesTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quoteModal, setQuoteModal] = useState<Booking | null>(null);
  const [defaultDepositPercent, setDefaultDepositPercent] = useState(30);
  const [pricingRules, setPricingRules] = useState<PricingRules | undefined>(undefined);

  useEffect(() => {
    const loadBookings = fetch("/api/user/bookings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.bookings) setBookings(data.bookings);
      });

    const loadPricingRules = fetch("/api/user/pricing-rules")
      .then((r) => r.json())
      .then((data) => {
        if (data?.profile) {
          setDefaultDepositPercent(data.profile.defaultDepositPercent ?? 30);
          setPricingRules(data.profile.pricingRules || undefined);
        }
      });

    Promise.all([loadBookings, loadPricingRules])
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const quoteSent = bookings.filter((b) => b.status === "quote_sent");
  const visible = quoteSent;

  const handleQuoteSent = useCallback(() => {
    if (!quoteModal) return;
    setBookings((prev) =>
      prev.map((b) => (b.id === quoteModal.id ? { ...b, status: "quote_sent" } : b))
    );
  }, [quoteModal]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sent Quotes</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Custom quotes you&apos;ve sent to customers
        </p>
      </div>

      {error ? (
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-red-300 dark:text-red-600 mx-auto mb-4" />
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">
            No quotes sent yet
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
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400 rounded-full">
                      Quote Sent
                    </span>
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
                  <button
                    onClick={() => setQuoteModal(b)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 transition-all shadow-sm"
                  >
                    View Quote
                  </button>
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
          serviceId={quoteModal.serviceId}
          bookingDate={quoteModal.date}
          defaultDepositPercent={defaultDepositPercent}
          pricingRules={pricingRules}
          onClose={() => setQuoteModal(null)}
          onSuccess={handleQuoteSent}
        />
      )}
    </div>
  );
}
