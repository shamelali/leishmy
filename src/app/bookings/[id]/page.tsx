"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, User, ArrowLeft, Sparkles, XCircle, CheckCircle, AlertCircle } from "lucide-react";
import Skeleton from "@/components/Skeleton";

interface BookingDetail {
  id: string;
  userId: string;
  artistId: number | null;
  artistName: string;
  clientName: string;
  clientEmail: string;
  date: string;
  time: string;
  status: string;
  amount: string;
  createdAt: string;
}

export default function BookingDetailPage() {
  const params = useParams();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings?id=${params.id}`);
        if (!res.ok) {
          setError("Booking not found");
          return;
        }
        const data = await res.json();
        setBooking(data.booking);
      } catch {
        setError("Failed to load booking");
      }
      setLoading(false);
    };
    fetchBooking();
  }, [params.id]);

  const statusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "cancelled": return <XCircle className="w-5 h-5 text-red-500" />;
      case "completed": return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default: return <AlertCircle className="w-5 h-5 text-amber-500" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400";
      case "cancelled": return "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400";
      case "completed": return "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400";
      default: return "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400";
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-6 w-32 mb-8" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Booking Not Found</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link href="/bookings" className="text-sm font-medium text-rose-500 hover:text-rose-600">Back to Bookings</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/bookings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Bookings
      </Link>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Booking #{booking.id}</h1>
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${statusColor(booking.status)}`}>
              {statusIcon(booking.status)}
              {booking.status}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
              <Calendar className="w-5 h-5 text-rose-500" />
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
              <Clock className="w-5 h-5 text-rose-500" />
              <div>
                <p className="text-xs text-gray-400">Time</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.time || "—"}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/50">
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Amount</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">MYR {Number(booking.amount).toLocaleString()}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Client</h3>
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30">
                <User className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.clientName}</p>
                <p className="text-xs text-gray-400">{booking.clientEmail}</p>
              </div>
            </div>
          </div>

          {booking.artistName && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Artist</h3>
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/30">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.artistName}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
