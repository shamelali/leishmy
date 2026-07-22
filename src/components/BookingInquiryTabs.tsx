"use client";

import { useState } from "react";
import { CalendarDays, Mail, Send, CheckCircle } from "lucide-react";
import { BookingForm } from "./BookingForm";

interface InquiryFormProps {
  artistId: string;
  artistName: string;
}

function InquiryForm({ artistId, artistName }: InquiryFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId,
          name,
          email,
          phone,
          location,
          message,
        }),
      });

      if (!res.ok) throw new Error("Inquiry failed");
      setSuccess(true);
    } catch {
      setError("Failed to send inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Inquiry Sent!
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Your message has been sent to {artistName}. They&apos;ll respond within
          their stated response time.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setName("");
            setEmail("");
            setPhone("");
            setLocation("");
            setMessage("");
          }}
          className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium"
        >
          Send Another Inquiry
        </button>
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

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Phone (optional)
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+60 12 345 6789"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Location (optional)
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Kuala Lumpur, Petaling Jaya"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          placeholder="Hi! I&apos;m interested in your bridal makeup services for my wedding on [date]. Could you share your availability and packages?"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Sending...
          </span>
        ) : (
          "Send Inquiry"
        )}
      </button>
    </form>
  );
}

interface BookingInquiryTabsProps {
  artistId: string;
  artistName: string;
  price: number;
}

export function BookingInquiryTabs({ artistId, artistName, price }: BookingInquiryTabsProps) {
  const [activeTab, setActiveTab] = useState<"book" | "inquire">("book");

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-700 shadow-xl p-6">
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-neutral-700 pb-4">
        <button
          onClick={() => setActiveTab("book")}
          className={`flex-1 flex items-center gap-2 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "book"
              ? "bg-rose-500 text-white"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Book Now
        </button>
        <button
          onClick={() => setActiveTab("inquire")}
          className={`flex-1 flex items-center gap-2 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
            activeTab === "inquire"
              ? "bg-rose-500 text-white"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Mail className="w-4 h-4" />
          Inquire
        </button>
      </div>

      {activeTab === "book" && (
        <>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Book {artistName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Starting from MYR {price}/hr
          </p>
          <BookingForm artistId={artistId} artistName={artistName} />
        </>
      )}

      {activeTab === "inquire" && (
        <>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Message {artistName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Have questions before booking? Send a direct message.
          </p>
          <InquiryForm artistId={artistId} artistName={artistName} />
        </>
      )}
    </div>
  );
}