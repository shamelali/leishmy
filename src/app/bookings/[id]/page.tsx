"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, User, ArrowLeft, Sparkles, XCircle, CheckCircle, AlertCircle, DollarSign, Car, Building, Save, Tag, FileText } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import ReviewSection from "@/components/ReviewSection";
import { useAuth } from "@/context/AuthContext";

interface BookingDetail {
  id: string;
  userId: string;
  artistId: string | null;
  studioId: string | null;
  artistName: string;
  clientName: string;
  clientEmail: string;
  service: string | null;
  date: string;
  time: string;
  status: string;
  amount: string;
  depositAmount: string | null;
  travelSurcharge: string | null;
  accommodationFee: string | null;
  servicePrice: string | null;
  discount: string | null;
  discountReason: string | null;
  extras: Array<{ name: string; price: number }> | null;
  packageName: string | null;
  depositPercent: number | null;
  createdAt: string;
}

export default function BookingDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Editable price fields (for providers)
  const [editingPrice, setEditingPrice] = useState(false);
  const [serviceAmount, setServiceAmount] = useState("");
  const [travelFee, setTravelFee] = useState("");
  const [accommodationFee, setAccommodationFee] = useState("");
  const [depositAmt, setDepositAmt] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);
  // Quote breakdown fields
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [extras, setExtras] = useState<Array<{ name: string; price: number }>>([]);
  const [packageName, setPackageName] = useState("");
  const [depositPercent, setDepositPercent] = useState(30);

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
        // Initialize editable fields
        const amt = Number(data.booking.amount) || 0;
        const travel = Number(data.booking.travelSurcharge) || 0;
        const accom = Number(data.booking.accommodationFee) || 0;
        setServiceAmount(String(amt - travel - accom));
        setTravelFee(String(travel));
        setAccommodationFee(String(accom));
        setDepositAmt(String(Number(data.booking.depositAmount) || 0));
        // Initialize price breakdown fields
        setDiscountAmount(String(Number(data.booking.discount) || 0));
        setDiscountReason(data.booking.discountReason || "");
        setExtras(data.booking.extras || []);
        setPackageName(data.booking.packageName || "");
        setDepositPercent(data.booking.depositPercent || 30);
      } catch {
        setError("Failed to load booking");
      }
      setLoading(false);
    };
    fetchBooking();
  }, [params.id]);

  const handleSavePrice = async () => {
    if (!booking) return;
    setSavingPrice(true);
    try {
      const svc = Number(serviceAmount) || 0;
      const travel = Number(travelFee) || 0;
      const accom = Number(accommodationFee) || 0;
      const total = svc + travel + accom;
      const deposit = Number(depositAmt) || 0;

      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(booking.id),
          amount: total,
          travelSurcharge: travel,
          accommodationFee: accom,
          depositAmount: deposit,
          discount: Number(discountAmount) || 0,
          discountReason: discountReason || undefined,
          extras: extras.length > 0 ? extras : undefined,
          packageName: packageName || undefined,
          depositPercent,
        }),
      });

      if (res.ok) {
        setBooking({
          ...booking,
          amount: String(total),
          travelSurcharge: String(travel),
          accommodationFee: String(accom),
          depositAmount: String(deposit),
          discount: String(Number(discountAmount) || 0),
          discountReason: discountReason || null,
          extras: extras.length > 0 ? extras : null,
          packageName: packageName || null,
          depositPercent,
        });
        setEditingPrice(false);
      }
    } catch {
      alert("Failed to save pricing");
    }
    setSavingPrice(false);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "in_progress": return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "completed": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "cancelled":
      case "rejected": return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-amber-500" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400";
      case "in_progress": return "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400";
      case "completed": return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "cancelled":
      case "rejected": return "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400";
      default: return "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "requested": return "New Request";
      case "quote_sent": return "Quote Sent";
      case "pending": return "Awaiting Payment";
      case "confirmed": return "Confirmed";
      case "in_progress": return "In Progress";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      case "rejected": return "Rejected";
      default: return status;
    }
  };

  const backHref = "/bookings";
  const backLabel = "Back to Bookings";

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> {backLabel}
        </Link>
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
        <Link href={backHref} className="text-sm font-medium text-rose-500 hover:text-rose-600">{backLabel}</Link>
      </div>
    );
  }

  // Determine if current user is a provider (artist/studio) for this booking
  const isProvider = user && (
    booking.artistId === user.id || booking.studioId === user.id
  );
  const providerBackHref = isProvider
    ? (booking.studioId === user?.id ? "/dashboard/studio/bookings" : "/dashboard/artist")
    : "/bookings";
  const providerBackLabel = isProvider ? "Back to Dashboard" : "Back to Bookings";

  const extrasTotal = extras.reduce((sum, e) => sum + e.price, 0);
  const totalAmount = (Number(serviceAmount) || 0) + (Number(travelFee) || 0) + (Number(accommodationFee) || 0) + extrasTotal - (Number(discountAmount) || 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={providerBackHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
        <ArrowLeft className="w-4 h-4" /> {providerBackLabel}
      </Link>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Booking #{booking.id}</h1>
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${statusColor(booking.status)}`}>
              {statusIcon(booking.status)}
              {statusLabel(booking.status)}
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

          {/* Price Breakdown */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Price Breakdown</p>
              {isProvider && !editingPrice && (
                <button
                  onClick={() => setEditingPrice(true)}
                  className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                >
                  Edit
                </button>
              )}
            </div>

            {editingPrice ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400 shrink-0" />
                  <label className="text-xs text-gray-500 w-28 shrink-0">Service</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={serviceAmount}
                    onChange={(e) => setServiceAmount(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-right"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-gray-400 shrink-0" />
                  <label className="text-xs text-gray-500 w-28 shrink-0">Travel Fee</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={travelFee}
                    onChange={(e) => setTravelFee(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-right"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400 shrink-0" />
                  <label className="text-xs text-gray-500 w-28 shrink-0">Accommodation</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={accommodationFee}
                    onChange={(e) => setAccommodationFee(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-right"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                  <label className="text-xs text-gray-500 w-28 shrink-0">Discount (max 50%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-right"
                  />
                </div>
                {discountAmount && Number(discountAmount) > 0 && (
                  <input
                    type="text"
                    placeholder="Reason"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                  />
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-28 shrink-0">Deposit %</span>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={depositPercent}
                    onChange={(e) => setDepositPercent(Number(e.target.value))}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-right"
                  />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-amber-200 dark:border-amber-800">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">MYR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePrice}
                    disabled={savingPrice}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" /> {savingPrice ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setEditingPrice(false)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium text-gray-900 dark:text-white">MYR {Number(serviceAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {(Number(travelFee) || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><Car className="w-3 h-3" /> Travel</span>
                    <span className="font-medium text-gray-900 dark:text-white">MYR {Number(travelFee).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {(Number(accommodationFee) || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1"><Building className="w-3 h-3" /> Accommodation</span>
                    <span className="font-medium text-gray-900 dark:text-white">MYR {Number(accommodationFee).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {extras.length > 0 && (
                  <>
                    <p className="text-xs text-gray-400 mt-2">Extras</p>
                    {extras.map((extra, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-500">{extra.name}</span>
                        <span className="font-medium text-gray-900 dark:text-white">MYR {extra.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </>
                )}
                {(Number(discountAmount) || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400">Discount {discountReason ? `(${discountReason})` : ""}</span>
                    <span className="font-medium text-green-600 dark:text-green-400">-MYR {Number(discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-amber-200 dark:border-amber-800">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">MYR {Number(booking.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {(Number(booking.depositAmount) || 0) > 0 && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{depositPercent || 30}% Deposit</span>
                    <span>MYR {Number(booking.depositAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {packageName && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Package</span>
                    <span>{packageName}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {booking.service && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Event type</h3>
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.service}</p>
              </div>
            </div>
          )}

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

          {(booking.status === "confirmed" || booking.status === "in_progress" || booking.status === "completed") && (
            <div className="pt-2">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/invoices", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ bookingId: Number(booking.id) }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      window.open(`/api/invoices/${data.invoice.id}`, "_blank");
                    }
                  } catch {
                    alert("Failed to generate invoice");
                  }
                }}
                className="flex items-center gap-2 w-full justify-center px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <FileText className="w-4 h-4 text-rose-500" /> Download Invoice
              </button>
            </div>
          )}

          {/* Review section for completed bookings (customer only) */}
          {booking.status === "completed" && !isProvider && user?.id === booking.userId && (
            <div id="review" className="pt-4 border-t border-gray-100 dark:border-neutral-800">
              <ReviewSection
                bookingId={Number(booking.id)}
                artistId={booking.artistId}
                studioId={booking.studioId}
                serviceName={booking.service || ""}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
