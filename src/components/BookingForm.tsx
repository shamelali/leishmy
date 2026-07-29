"use client";

import { useState } from "react";
import { CalendarDays, Clock, CheckCircle } from "lucide-react";

interface BookingFormProps {
  artistId: string;
  artistName: string;
}

export function BookingForm({ artistId, artistName }: BookingFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showTravelSurcharge, setShowTravelSurcharge] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const services = [
    "Bridal Makeup",
    "Event Glam",
    "Editorial/Photoshoot",
    "Natural Look",
    "Party Makeup",
    "Hijab Styling + Makeup",
    "Trial Session",
  ];

  const timeSlots = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
  ];

  function getDepositInfo(svc: string) {
    const s = svc.toLowerCase();
    if (s.includes("bridal")) return { percentage: 50, label: "50% Non-Refundable Deposit" };
    if (s.includes("trial")) return { percentage: 100, label: "Full Upfront Payment" };
    if (s.includes("event") || s.includes("glam") || s.includes("personal")) return { percentage: 30, label: "30% Non-Refundable Deposit" };
    return { percentage: 30, label: "30% Non-Refundable Deposit" };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId,
          clientName: name,
          clientEmail: email,
          service,
          date,
          time,
          location,
          notes,
          travelSurcharge: showTravelSurcharge,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Booking failed");

      const bookingId = data?.booking?.id;
      if (!bookingId) throw new Error("Booking created without an id");

      const billRes = await fetch("/api/payments?action=create-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          name,
          email,
          description: `${service} with ${artistName}`,
          idempotencyKey: `booking_${bookingId}`,
        }),
      });

      const billData = await billRes.json();
      if (!billRes.ok) throw new Error(billData?.error || "Failed to start payment");

      if (billData?.bill?.url) {
        setSuccess(true);
        window.location.href = billData.bill.url;
        return;
      }

      throw new Error("Payment could not be started for this booking");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit booking. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Booking Received!
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Redirecting you to secure payment for your booking with {artistName}...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Your Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Siti Nurhaliza"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Service */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Service
        </label>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
        >
          <option value="">Select a service</option>
          {services.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          <CalendarDays className="w-4 h-4 inline-block mr-1" /> Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          min={today}
          max={maxDateStr}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          <Clock className="w-4 h-4 inline-block mr-1" /> Time
        </label>
        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
        >
          <option value="">Select time</option>
          {timeSlots.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

       {/* Location */}
       <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
           Location
         </label>
         <input
           type="text"
           value={location}
           onChange={(e) => setLocation(e.target.value)}
           placeholder="e.g. Hotel name, studio address, or venue"
           className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
         />
       </div>

       {/* Travel Surcharge */}
       <div className="flex items-center gap-3">
         <input
           type="checkbox"
           id="travelSurcharge"
           checked={showTravelSurcharge}
           onChange={(e) => setShowTravelSurcharge(e.target.checked)}
           className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
         />
         <label htmlFor="travelSurcharge" className="text-sm text-gray-600 dark:text-gray-400">
           Out-of-area travel (additional charge applies)
         </label>
       </div>

       {/* Notes */}
       <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
           Notes (optional)
         </label>
         <textarea
           value={notes}
           onChange={(e) => setNotes(e.target.value)}
           rows={3}
           placeholder="Any special requests..."
           className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none"
         />
       </div>

       {/* Deposit Info */}
       {service && (() => {
         const info = getDepositInfo(service);
         return (
           <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-4 border border-rose-200 dark:border-rose-800">
             <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
               Payment Plan
             </p>
             <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
               {info.label} — the deposit is{" "}
               <strong>non-refundable</strong> if cancelled within 48 hours of the booking.
               {info.percentage < 100 && (
                 <>
                   {" "}
                   The remaining balance is collected{" "}
                   {info.percentage === 50
                     ? "7 days before the wedding date via a follow-up payment link."
                     : "after the service is completed via QR code on-site."}
                 </>
               )}
             </p>
           </div>
         );
       })()}

       {/* Policies */}
       <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
         <p>• Late arrival: RM50 fee after 15 min; booking cancelled after 30 min</p>
         <p>• No-show: deposit forfeited</p>
       </div>

       {error && (
         <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
       )}

       <button
         type="submit"
         disabled={submitting}
         className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
       >
         {submitting ? "Booking..." : "Book Now"}
       </button>
     </form>
   );
 }
