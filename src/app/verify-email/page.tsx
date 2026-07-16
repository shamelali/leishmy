import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import VerifyEmailContent from "./verify-email-content";

export async function generateMetadata() {
  const m = await getTranslations("metadata");
  return {
    title: m("defaultTitle"),
  };
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-xl p-8">
          <Suspense fallback={<div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">Loading…</div>}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
