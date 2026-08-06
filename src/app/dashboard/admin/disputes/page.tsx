"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";

interface Dispute {
  id: string;
  bookingId: string;
  reporterName: string;
  againstName: string;
  reason: string;
  category: string;
  status: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_TABS = ["all", "open", "under_review", "resolved", "closed"] as const;

const STATUS_LABELS: Record<string, string> = {
  all: "All",
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
  under_review: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
  resolved: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
  closed: "bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400",
};

const CATEGORY_STYLES: Record<string, string> = {
  general: "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400",
  payment: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
  quality: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
  no_show: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  cancellation: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState("");

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
      });
      if (activeStatus !== "all") {
        params.set("status", activeStatus);
      }
      const res = await fetch(`/api/admin/disputes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error("Failed to fetch disputes:", e);
    } finally {
      setLoading(false);
    }
  }, [page, activeStatus]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleStatusChange = (status: string) => {
    setActiveStatus(status);
    setPage(1);
  };

  const handleResolve = async (disputeId: string) => {
    if (!resolutionText.trim()) return;
    setActionLoading(`resolve-${disputeId}`);
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-status",
          disputeId,
          status: "resolved",
          resolution: resolutionText.trim(),
        }),
      });
      if (res.ok) {
        setResolvingId(null);
        setResolutionText("");
        fetchDisputes();
      }
    } catch (e) {
      console.error("Failed to resolve dispute:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async (disputeId: string) => {
    setActionLoading(`close-${disputeId}`);
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close", disputeId, resolution: null }),
      });
      if (res.ok) {
        fetchDisputes();
      }
    } catch (e) {
      console.error("Failed to close dispute:", e);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && disputes.length === 0) {
    return <DashboardLoading fullPage />;
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dispute Resolution
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage and resolve platform disputes
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {total}
                </p>
                <p className="text-xs text-gray-500">Open Disputes</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {disputes.filter((d) => d.status === "under_review").length}
                </p>
                <p className="text-xs text-gray-500">Under Review</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {disputes.filter((d) => d.status === "resolved").length}
                </p>
                <p className="text-xs text-gray-500">Resolved This Month</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-50 dark:bg-violet-950/30 rounded-xl">
                <MessageSquare className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {total}
                </p>
                <p className="text-xs text-gray-500">Total Disputes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeStatus === status
                  ? "bg-rose-500 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        {disputes.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-16 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              No disputes found
            </h3>
            <p className="text-sm text-gray-500">
              {activeStatus === "all"
                ? "No disputes have been reported yet."
                : `No disputes with status "${STATUS_LABELS[activeStatus]}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div
                key={dispute.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-4 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-mono text-gray-500">
                      #{dispute.id.slice(0, 8)}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        CATEGORY_STYLES[dispute.category] || CATEGORY_STYLES.general
                      }`}
                    >
                      {dispute.category}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_STYLES[dispute.status] || STATUS_STYLES.open
                      }`}
                    >
                      {dispute.status.replace("_", " ")}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(dispute.createdAt).toLocaleDateString("en-MY", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{dispute.reporterName}</span>
                  <span className="text-gray-400">vs</span>
                  <span className="font-medium">{dispute.againstName}</span>
                </div>

                {dispute.bookingId && (
                  <p className="text-xs text-gray-400 mb-2">
                    Booking: {dispute.bookingId}
                  </p>
                )}

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {dispute.reason}
                </p>

                {dispute.resolution && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-xl">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                      Resolution
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {dispute.resolution}
                    </p>
                  </div>
                )}

                {resolvingId === dispute.id ? (
                  <div className="border-t border-gray-100 dark:border-neutral-800 pt-4">
                    <textarea
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="Enter resolution notes..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-700 rounded-xl bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 resize-none"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleResolve(dispute.id)}
                        disabled={actionLoading === `resolve-${dispute.id}` || !resolutionText.trim()}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        {actionLoading === `resolve-${dispute.id}`
                          ? "Submitting..."
                          : "Submit Resolution"}
                      </button>
                      <button
                        onClick={() => {
                          setResolvingId(null);
                          setResolutionText("");
                        }}
                        className="px-4 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {dispute.status !== "resolved" && dispute.status !== "closed" && (
                      <>
                        <button
                          onClick={() => {
                            setResolvingId(dispute.id);
                            setResolutionText(dispute.resolution || "");
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Resolve
                        </button>
                        {dispute.status !== "closed" && (
                          <button
                            onClick={() => handleClose(dispute.id)}
                            disabled={actionLoading === `close-${dispute.id}`}
                            className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading === `close-${dispute.id}` ? (
                              "Closing..."
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 inline mr-1" />
                                Close
                              </>
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
