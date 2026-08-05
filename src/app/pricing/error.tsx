"use client";

import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-300 dark:text-red-600 mx-auto mb-4" />
        <p className="text-red-500 dark:text-red-400 text-lg mb-4">
          Failed to load pricing page
        </p>
        <button
          onClick={reset}
          className="px-6 py-2 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}