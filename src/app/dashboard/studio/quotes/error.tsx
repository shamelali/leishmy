"use client";

export default function StudioQuotesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
