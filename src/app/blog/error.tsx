"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-semibold mb-2">Failed to load blog</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Something went wrong. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
