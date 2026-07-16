"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function LeishPlusSuccessPage() {
  const t = useTranslations("subscription");
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/subscription");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-gradient-to-b from-white via-rose-50/30 to-white dark:from-neutral-950 dark:via-rose-950/10 dark:to-neutral-950">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-scale-in">
          <Check className="w-10 h-10 text-white" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 mb-4">
          <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {t('activePlan')}
          </span>
        </div>

        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
          Welcome to Leish+!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Your payment has been confirmed. You now have access to all premium features. Start
          enjoying priority booking, exclusive discounts, and more.
        </p>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            What&apos;s next?
          </h2>
          <div className="space-y-3 text-left">
            {[
              "Browse artists and enjoy priority booking",
              "Check your exclusive member discounts",
              "Get AI beauty consultation",
              "Set up your beauty profile",
            ].map((step, i) => (
              <div
                key={step}
                className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300"
              >
                <span className="w-6 h-6 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/subscription"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold rounded-2xl hover:from-amber-600 hover:to-rose-700 transition-all shadow-lg"
          >
            <Crown className="w-4 h-4" /> Manage Subscription
          </Link>
          <Link
            href="/artists"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white font-bold rounded-2xl border border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
          >
            <Sparkles className="w-4 h-4" /> Browse Artists
          </Link>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-6">
          Redirecting to your subscription page in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}
