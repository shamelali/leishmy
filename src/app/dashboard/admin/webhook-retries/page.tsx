"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RotateCw,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  Zap,
} from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";

interface WebhookEvent {
  id: number;
  event: string;
  payload: any;
  status: string;
  createdAt: string;
}

export default function WebhookRetriesPage() {
  const [retryEvents, setRetryEvents] = useState<WebhookEvent[]>([]);
  const [deadLetterEvents, setDeadLetterEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadWebhookEvents = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      try {
        setError(null);
        const [retryRes, deadLetterRes] = await Promise.all([
          fetch("/api/admin/webhook-retries/retry-scheduled"),
          fetch("/api/admin/webhook-retries/dead-letter"),
        ]);

        if (cancelled) return;

        if (retryRes.ok) {
          const retryData = await retryRes.json();
          setRetryEvents(retryData.data || []);
        }

        if (deadLetterRes.ok) {
          const deadLetterData = await deadLetterRes.json();
          setDeadLetterEvents(deadLetterData.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load webhook events:", err);
          setError("Failed to load webhook events");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  const handleProcessAllRetries = async () => {
    try {
      setProcessing(true);
      setMessage(null);
      const res = await fetch("/api/admin/webhook-retries/process", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.data?.message || "Processed webhook retries successfully");
        await loadWebhookEvents();
      } else {
        setError(data.error || "Failed to process retries");
      }
    } catch (err) {
      console.error("Error processing webhooks:", err);
      setError("Error processing webhooks");
    } finally {
      setProcessing(false);
    }
  };

  const handleManualRetryDeadLetter = async (eventId: number) => {
    try {
      setMessage(null);
      const res = await fetch(
        `/api/admin/webhook-retries/retry?eventId=${eventId}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) {
        setMessage(`Event #${eventId} moved to retry queue`);
        await loadWebhookEvents();
      } else {
        setError(data.error || "Failed to move dead letter webhook");
      }
    } catch (err) {
      console.error("Error processing dead letter webhook:", err);
      setError("Error processing dead letter webhook");
    }
  };

  if (loading && retryEvents.length === 0 && deadLetterEvents.length === 0) {
    return <DashboardLoading fullPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <RotateCw className="w-6 h-6 text-rose-500" />
              Webhook Retry Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Monitor and manage webhook delivery failures and dead letter queue
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleProcessAllRetries}
              disabled={processing || retryEvents.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Zap className="w-4 h-4" />
              {processing ? "Processing..." : "Process Retries Now"}
            </button>
            <button
              onClick={loadWebhookEvents}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {message && (
          <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-xl flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Retry Queue */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Retry Queue ({retryEvents.length})
            </h2>
            <span className="text-xs text-gray-500">
              Webhooks scheduled for automatic retry
            </span>
          </div>

          {retryEvents.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No webhooks currently in retry queue
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-neutral-800/50 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">Retry Count</th>
                    <th className="p-3">Next Retry At</th>
                    <th className="p-3">Last Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {retryEvents.map((event) => {
                    const payload =
                      typeof event.payload === "object" && event.payload !== null
                        ? (event.payload as {
                            retryCount?: number;
                            nextRetryAt?: string;
                            lastError?: string;
                          })
                        : {};
                    const nextRetryAt = payload.nextRetryAt
                      ? new Date(payload.nextRetryAt)
                      : null;

                    return (
                      <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/40">
                        <td className="p-3 font-mono text-xs">{event.id}</td>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">
                          {event.event}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
                            {payload.retryCount ?? 0}/3
                          </span>
                        </td>
                        <td className="p-3 text-xs text-gray-500">
                          {nextRetryAt ? nextRetryAt.toLocaleTimeString() : "Pending"}
                        </td>
                        <td className="p-3 text-xs text-red-500 max-w-xs truncate">
                          {payload.lastError || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dead Letter Queue */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Dead Letter Queue ({deadLetterEvents.length})
            </h2>
            <span className="text-xs text-gray-500">
              Webhooks that exceeded max retry attempts
            </span>
          </div>

          {deadLetterEvents.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No webhooks in dead letter queue
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-neutral-800/50 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">Retry Count</th>
                    <th className="p-3">DLQ Date</th>
                    <th className="p-3">Last Error</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {deadLetterEvents.map((event) => {
                    const payload =
                      typeof event.payload === "object" && event.payload !== null
                        ? (event.payload as {
                            retryCount?: number;
                            movedToDeadLetterAt?: string;
                            lastError?: string;
                          })
                        : {};
                    const movedAt = payload.movedToDeadLetterAt
                      ? new Date(payload.movedToDeadLetterAt)
                      : null;

                    return (
                      <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/40">
                        <td className="p-3 font-mono text-xs">{event.id}</td>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">
                          {event.event}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400">
                            {payload.retryCount ?? 0}/3
                          </span>
                        </td>
                        <td className="p-3 text-xs text-gray-500">
                          {movedAt
                            ? movedAt.toLocaleDateString("en-MY", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="p-3 text-xs text-red-500 max-w-xs truncate">
                          {payload.lastError || "—"}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleManualRetryDeadLetter(event.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                          >
                            <Send className="w-3 h-3" /> Re-queue
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
