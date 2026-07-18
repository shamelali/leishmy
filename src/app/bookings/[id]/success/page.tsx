"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle, Loader2, AlertCircle, ArrowRight, Calendar } from "lucide-react";

export default function BookingPaymentSuccessPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const [status, setStatus] = useState<"loading" | "verified" | "pending">("loading");

  useEffect(() => {
    if (!bookingId) return;

    let attempts = 0;
    const maxAttempts = 6;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/bookings?id=${bookingId}`);
        if (!res.ok) return;
        const data = await res.json();
        // Webhook updates payment status; once the booking is paid/confirmed we can show verified.
        if (data.booking?.status === "confirmed" || data.booking?.status === "completed") {
          setStatus("verified");
          clearInterval(interval);
        } else if (attempts >= maxAttempts) {
          setStatus("pending");
          clearInterval(interval);
        }
      } catch {
        if (attempts >= maxAttempts) {
          setStatus("pending");
          clearInterval(interval);
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [bookingId]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-8 text-center shadow-sm">
        {status === "loading" && (
          <>
            <Loader2 className="w-14 h-14 text-rose-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Confirming Payment
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please wait while we verify your payment with Billplz...
            </p>
          </>
        )}

        {status === "verified" && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Successful!
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Your booking #{bookingId} has been confirmed. You will receive a confirmation email shortly.
            </p>
          </>
        )}

        {status === "pending" && (
          <>
            <AlertCircle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Received
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              We received your payment but are still finalizing your booking. This usually takes a few moments. You can check the latest status on your bookings page.
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href={`/bookings/${bookingId}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-colors"
          >
            <Calendar className="w-4 h-4" /> View Booking
          </Link>
          <Link
            href="/bookings"
            className="inline-flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-rose-500 transition-colors"
          >
            Back to My Bookings <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
