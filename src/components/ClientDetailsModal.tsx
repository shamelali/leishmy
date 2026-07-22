"use client";

import { X, User, Mail, Phone, MapPin, Calendar, Clock, Sparkles, MessageSquare, Tag } from "lucide-react";

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "booking" | "inquiry";
  data: {
    id: string | number;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    location?: string;
    service?: string;
    date?: string;
    time?: string;
    amount?: string | number;
    status?: string;
    message?: string;
    createdAt?: string;
  };
}

const statusColor = (status: string) => {
  switch (status) {
    case "pending": return "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50";
    case "confirmed": return "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50";
    case "completed": return "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-900/50";
    case "cancelled": return "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/50";
    default: return "bg-gray-50 text-gray-600 dark:bg-neutral-800 dark:text-gray-300 border border-gray-200 dark:border-neutral-700";
  }
};

export default function ClientDetailsModal({ isOpen, onClose, type, data }: ClientDetailsModalProps) {
  if (!isOpen) return null;

  const title = type === "booking" ? "Booking Details" : "Inquiry Details";
  const idLabel = type === "booking" ? "Booking #" : "Inquiry #";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">{idLabel}{data.id}</p>
            {data.status && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(data.status)}`}>
                {data.status}
              </span>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4 text-rose-500" /> Client Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Name</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.clientName || "—"}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white break-all">
                  {data.clientEmail || "—"}
                </p>
              </div>
              {data.clientPhone && (
                <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">Phone</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.clientPhone}
                  </p>
                </div>
              )}
              {data.location && (
                <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">Location</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {data.location}
                  </p>
                </div>
              )}
            </div>
          </div>

          {type === "booking" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500" /> Booking Details
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {data.date && (
                  <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1">Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(data.date).toLocaleDateString("en-MY", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {data.time && (
                  <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1">Time</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {data.time}
                    </p>
                  </div>
                )}
                {data.service && (
                  <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl sm:col-span-2">
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Service
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {data.service}
                    </p>
                  </div>
                )}
                {data.amount !== undefined && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Amount</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      MYR {Number(data.amount).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {type === "inquiry" && data.message && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-500" /> Message
              </h3>
              <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                  {data.message}
                </p>
              </div>
            </div>
          )}

          {data.createdAt && (
            <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-neutral-800">
              <Tag className="w-3 h-3" />
              <span>
                {type === "booking" ? "Created" : "Received"}:{" "}
                {new Date(data.createdAt).toLocaleDateString("en-MY", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
