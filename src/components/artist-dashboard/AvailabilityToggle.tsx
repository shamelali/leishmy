"use client";

import { useState, useEffect, useRef } from "react";
import { Check, Loader2 } from "lucide-react";

interface AvailabilityToggleProps {
  available: boolean;
  onToggle: (available: boolean) => Promise<void>;
}

export default function AvailabilityToggle({
  available: initialAvailable,
  onToggle,
}: AvailabilityToggleProps) {
  const [available, setAvailable] = useState(initialAvailable);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setAvailable(initialAvailable);
  }, [initialAvailable]);

  async function handleToggle() {
    const newValue = !available;
    setAvailable(newValue);
    setStatus("saving");
    try {
      await onToggle(newValue);
    } catch {
      if (mountedRef.current) setAvailable(!newValue);
    }
    if (mountedRef.current) setStatus("idle");
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Available for bookings
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {available
            ? "Clients can find and book you"
            : "Your profile is hidden from searches"}
        </p>
      </div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={status === "saving"}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-50 ${
          available ? "bg-green-500" : "bg-gray-300 dark:bg-neutral-600"
        }`}
      >
        {status === "saving" ? (
          <Loader2 className="w-4 h-4 text-white animate-spin ml-4" />
        ) : (
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              available ? "translate-x-6" : "translate-x-1"
            }`}
          />
        )}
      </button>
    </div>
  );
}
