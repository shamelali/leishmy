import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function StudioDashboardNotFound() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="mx-auto h-16 w-16 text-amber-400 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Page not found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The studio dashboard page you are looking for does not exist.
        </p>
        <Link
          href="/dashboard/studio"
          className="inline-flex items-center justify-center px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
