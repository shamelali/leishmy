"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Clock, CheckCircle, CreditCard, MapPin, ArrowRight, ArrowLeft, X, Send } from "lucide-react";

interface ArtistService {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  popular: boolean;
  category: string;
}

interface BookingFormProps {
  artistId: string;
  artistName: string;
  services: ArtistService[];
}

type BookingStep = "service" | "details" | "submit" | "awaiting_quote" | "checkout";

const BRIDAL_SERVICES = [
  { id: "engagement", name: "Engagement", category: "bridal" },
  { id: "solemnization", name: "Solemnization", category: "bridal" },
  { id: "reception", name: "Reception", category: "bridal" },
  { id: "package", name: "Package (Select two or all)", category: "bridal" },
  { id: "bridal_other", name: "Other", category: "bridal", isCustom: true },
];

const EVENT_GLAM_SERVICES = [
  { id: "event_makeup", name: "Event Makeup", category: "event" },
  { id: "personal_glam", name: "Personal Glam", category: "event" },
  { id: "photoshoot", name: "Photoshoot Makeup", category: "event" },
  { id: "workshop", name: "Workshop/Class", category: "event" },
  { id: "event_other", name: "Other", category: "event", isCustom: true },
];

export function BookingForm({ 
  artistId, 
  artistName, 
  services 
}: BookingFormProps) {
  const [step, setStep] = useState<BookingStep>("service");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [customService, setCustomService] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<{
    servicePrice: number;
    accommodationFee: number;
    travelFee: number;
    totalPrice: number;
    quoteId: string;
  } | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  ];

  const allServices = [...BRIDAL_SERVICES, ...EVENT_GLAM_SERVICES];
  const selectedServiceData = allServices.find(s => s.id === service);
  
  const isBridal = selectedServiceData?.category === "bridal";
  const isCustomService = selectedServiceData?.isCustom;
  const isPackage = service === "package";

  function getServiceLabel(id: string): string {
    const s = allServices.find(x => x.id === id);
    return s?.name || id;
  }

  const handleNext = () => {
    if (step === "service") {
      if (!service) {
        setError("Please select a service");
        return;
      }
      if (isCustomService && !customService.trim()) {
        setError("Please specify the service");
        return;
      }
      if (isPackage && selectedServices.length === 0) {
        setError("Please select at least one service for the package");
        return;
      }
      setError("");
      setStep("details");
    } else if (step === "details") {
      if (!name || !email || !date || !time || !location) {
        setError("Please fill in all required fields");
        return;
      }
      setError("");
      setStep("submit");
    }
  };

  const handleBack = () => {
    if (step === "details") setStep("service");
    else if (step === "submit") setStep("details");
    else if (step === "awaiting_quote") setStep("submit");
    else if (step === "checkout") setStep("awaiting_quote");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      let serviceDesc = "";
      if (isPackage) {
        serviceDesc = `Package: ${selectedServices.map(getServiceLabel).join(", ")}`;
      } else if (isCustomService) {
        serviceDesc = `Custom: ${customService}`;
      } else {
        serviceDesc = getServiceLabel(service);
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId,
          clientName: name,
          clientEmail: email,
          service: serviceDesc,
          date,
          time,
          location,
          notes,
          // No fees - MUA will add them
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Booking failed");

      const bid = data?.booking?.id;
      if (!bid) throw new Error("Booking created without an id");

      setBookingId(bid);
      setStep("awaiting_quote");
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

  const handleAcceptQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteData) return;
    
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${quoteData.quoteId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to accept quote");

      const billRes = await fetch("/api/payments?action=create-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: quoteData.quoteId,
          name,
          email,
          description: `Booking with ${artistName}`,
          idempotencyKey: `booking_${quoteData.quoteId}`,
          amount: quoteData.totalPrice * 100,
        }),
      });

      const billData = await billRes.json();
      if (!billRes.ok) throw new Error(billData?.error || "Failed to start payment");

      if (billData?.bill?.url) {
        setSuccess(true);
        window.location.href = billData.bill.url;
        return;
      }

      throw new Error("Payment could not be started");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to accept quote. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectQuote = () => {
    setQuoteData(null);
    setStep("submit");
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

  // Progress indicator
  const steps: { key: BookingStep; label: string }[] = [
    { key: "service", label: "Service" },
    { key: "details", label: "Details" },
    { key: "submit", label: "Submit" },
    { key: "awaiting_quote", label: "Quote" },
    { key: "checkout", label: "Payment" },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);
  const isAwaitingQuote = step === "awaiting_quote";
  const isCheckout = step === "checkout";

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              i < currentStepIndex 
                ? "bg-rose-500 text-white" 
                : i === currentStepIndex 
                ? "bg-rose-500 text-white ring-2 ring-rose-500 ring-offset-2 dark:ring-offset-neutral-900"
                : "bg-gray-200 dark:bg-neutral-700 text-gray-500"
            }`}>
              {i < currentStepIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 h-1 mx-2 ${
                i < currentStepIndex ? "bg-rose-500" : "bg-gray-200 dark:bg-neutral-700"
              }`} />
            )}
            <span className={`text-xs font-medium hidden sm:block ${
              i === currentStepIndex ? "text-rose-500" : "text-gray-500"
            }`}>{s.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Step 1: Service Selection */}
      {step === "service" && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select Service</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Prices will be shared privately after the MUA reviews your venue location.
          </p>

          {/* Bridal Category */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-rose-500" />
              </span>
              Bridal
            </h4>
            <div className="space-y-2">
              {BRIDAL_SERVICES.map(s => (
                <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  service === s.id
                    ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30"
                    : "border-gray-200 dark:border-neutral-700 hover:border-rose-200 dark:hover:border-rose-800"
                }`}>
                  <input
                    type="radio"
                    name="service"
                    value={s.id}
                    checked={service === s.id}
                    onChange={() => {
                      setService(s.id);
                      setCustomService("");
                      setSelectedServices([]);
                    }}
                    className="w-4 h-4 text-rose-500 border-gray-300 focus:ring-rose-500"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">{s.name}</span>
                  {s.isCustom && service === s.id && (
                    <input
                      type="text"
                      placeholder="Specify service..."
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      className="ml-auto w-48 px-3 py-1.5 text-sm border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Event & Glam Category */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-purple-500" />
              </span>
              Event & Glam
            </h4>
            <div className="space-y-2">
              {EVENT_GLAM_SERVICES.map(s => (
                <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  service === s.id
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                    : "border-gray-200 dark:border-neutral-700 hover:border-purple-200 dark:hover:border-purple-800"
                }`}>
                  <input
                    type="radio"
                    name="service"
                    value={s.id}
                    checked={service === s.id}
                    onChange={() => {
                      setService(s.id);
                      setCustomService("");
                      setSelectedServices([]);
                    }}
                    className="w-4 h-4 text-purple-500 border-gray-300 focus:ring-purple-500"
                  />
                  <span className="font-medium text-gray-900 dark:text-white">{s.name}</span>
                  {s.isCustom && service === s.id && (
                    <input
                      type="text"
                      placeholder="Specify service..."
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      className="ml-auto w-48 px-3 py-1.5 text-sm border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Package Selection - only show if "Package" is selected */}
          {isPackage && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Select services for your package (choose 2 or more):</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {["engagement", "solemnization", "reception"].map(id => (
                  <label key={id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                    selectedServices.includes(id)
                      ? "bg-rose-500/10 border-rose-500"
                      : "border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
                  }`}>
                    <input
                      type="checkbox"
                      value={id}
                      checked={selectedServices.includes(id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedServices([...selectedServices, id]);
                        } else {
                          setSelectedServices(selectedServices.filter(s => s !== id));
                        }
                      }}
                      className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{getServiceLabel(id)}</span>
                  </label>
                ))}
              </div>
              {selectedServices.length < 2 && (
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">Please select at least 2 services</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Event Details */}
      {step === "details" && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Event Details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Siti Nurhaliza"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
              <CalendarDays className="w-4 h-4" /> Date
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Time
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
            >
              <option value="">Select time</option>
              {timeSlots.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
              <MapPin className="w-4 h-4" /> Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Hotel name, studio address, or venue"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">MUA will use this to calculate any travel/accommodation fees</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any special requests..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 3: Submit Request */}
      {step === "submit" && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Review & Submit Request</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The MUA will review your venue location and send you a quote with any applicable travel/accommodation fees.
          </p>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Service</h4>
            <p className="text-gray-900 dark:text-white">
              {isPackage 
                ? `Package: ${selectedServices.map(getServiceLabel).join(", ")}`
                : isCustomService
                ? `Custom: ${customService}`
                : getServiceLabel(service)
              }
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Event Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Date</span>
                <span className="font-medium text-gray-900 dark:text-white">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Time</span>
                <span className="font-medium text-gray-900 dark:text-white">{time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Location</span>
                <span className="font-medium text-gray-900 dark:text-white">{location}</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Important:</strong> No payment is required yet. The MUA will review your request and send you a quote with the service price and any applicable travel/accommodation fees. You'll then be able to accept or reject the quote.
            </p>
          </div>
        </div>
      )}

      {/* Step 4: Awaiting Quote from MUA */}
      {step === "awaiting_quote" && (
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center">
            <Send className="w-10 h-10 text-rose-500 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Submitted!</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Your booking request has been sent to <strong>{artistName}</strong>. They will review your venue location and send you a quote with the service price and any applicable travel/accommodation fees.
          </p>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">What happens next?</h4>
            <div className="space-y-3 text-sm text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-rose-500 font-bold text-xs">1</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">MUA receives your request and checks venue location</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 font-bold text-xs">2</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">MUA adds service price + any travel/accommodation fees</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 font-bold text-xs">3</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">You receive a notification with the complete quote</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 font-bold text-xs">4</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">You Accept or Reject the quote</p>
              </div>
            </div>
          </div>
          {bookingId && (
            <div className="text-xs text-gray-400">
              Booking ID: {bookingId}
            </div>
          )}
        </div>
      )}

      {/* Step 5: Checkout - Quote Review with Accept/Reject */}
      {step === "checkout" && quoteData && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Review Quote</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The MUA has prepared a quote based on your venue location. Review and decide.
          </p>

          {/* Service Summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Service</h4>
            <p className="text-gray-900 dark:text-white">
              {isPackage 
                ? `Package: ${selectedServices.map(getServiceLabel).join(", ")}`
                : isCustomService
                ? `Custom: ${customService}`
                : getServiceLabel(service)
              }
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Service Price: MYR {quoteData.servicePrice}
            </p>
          </div>

          {/* Fees Summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Additional Fees</h4>
            <div className="space-y-2 text-sm">
              {quoteData.accommodationFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Overnight Accommodation</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">+ MYR {quoteData.accommodationFee}</span>
                </div>
              )}
              {quoteData.travelFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Travel Fee</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">+ MYR {quoteData.travelFee}</span>
                </div>
              )}
              {quoteData.accommodationFee === 0 && quoteData.travelFee === 0 && (
                <div className="text-gray-500 dark:text-gray-400 text-center py-2">No additional fees</div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-4 border border-rose-200 dark:border-rose-800">
            <div className="flex justify-between text-lg font-bold text-rose-600 dark:text-rose-400">
              <span>Total</span>
              <span>MYR {quoteData.totalPrice}</span>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-2 text-center">
              By accepting, you agree to the booking terms and deposit policy.
            </p>
          </div>

          {/* Accept / Reject Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRejectQuote}
              className="flex-1 py-3.5 px-4 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4 inline mr-2" /> Reject
            </button>
            <button
              type="submit"
              onClick={handleAcceptQuote}
              disabled={submitting}
              className="flex-1 py-3.5 px-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                "Accept & Proceed to Payment"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
        {step !== "service" && step !== "awaiting_quote" && step !== "checkout" && (
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 py-3 px-4 border border-gray-200 dark:border-neutral-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        {step !== "checkout" && step !== "awaiting_quote" && !success && (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3 px-4 bg-rose-500 text-white font-medium rounded-xl hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {step === "checkout" && (
          <button
            type="submit"
            onClick={handleAcceptQuote}
            disabled={submitting}
            className="flex-1 py-3.5 px-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Processing..." : "Accept & Proceed to Payment"}
          </button>
        )}
      </div>
    </div>
  );
}