"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Check, Crown, Calendar, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function SubscriptionPage() {
  const t = useTranslations("subscription");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    fetch(`/api/subscriptions?action=my`)
      .then((r) => r.json())
      .then((data) => setSubscription(data.subscription))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/subscriptions?action=cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        setSubscription((prev: any) => ({ ...prev, status: "cancelled" }));
      }
    } catch {
      console.error("Failed to cancel subscription");
      alert("Failed to cancel subscription");
    } finally {
      setCancelling(false);
      setShowConfirm(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Crown className="w-6 h-6 text-amber-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('heading')}</h1>
        </div>

        {!subscription ? (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-12 text-center">
            <Crown className="w-16 h-16 text-gray-200 dark:text-neutral-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('noSubscription')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              {t('noSubscriptionText')}
            </p>
            <Link
              href="/leish-plus"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold rounded-2xl hover:from-amber-600 hover:to-rose-700 transition-all shadow-lg"
            >
              <Sparkles className="w-4 h-4" /> {t('seePlans')}
            </Link>
          </div>
        ) : subscription.status === "cancelled" ? (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-12 text-center">
            <Crown className="w-16 h-16 text-gray-200 dark:text-neutral-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('cancelled')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t('benefitsActiveUntil')}{" "}
              {subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-MY", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : t('endOfPeriod')}
              .
            </p>
            <Link
              href="/leish-plus"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold rounded-2xl hover:from-amber-600 hover:to-rose-700 transition-all shadow-lg"
            >
              <Sparkles className="w-4 h-4" /> {t('resubscribe')}
            </Link>
          </div>
        ) : (
          <div>
            {/* Active Subscription Card */}
            <div className="bg-gradient-to-br from-amber-50 to-rose-50 dark:from-amber-950/40 dark:to-rose-950/40 rounded-3xl border border-amber-200 dark:border-amber-800 p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {subscription.plan?.name || t('activePlan')}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2.5 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> {t('active')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {subscription.currentPeriodEnd && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/60 dark:bg-neutral-900/60 rounded-2xl">
                    <Calendar className="w-5 h-5 text-rose-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('currentPeriodEnds')}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-MY", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Features */}
            {subscription.plan?.features && (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-6 mb-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                  {t('includedFeatures')}
                </h3>
                <div className="space-y-3">
                  {subscription.plan.features.map((feature: string) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300"
                    >
                      <Check className="w-4 h-4 text-rose-500 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancel */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-6">
              {!showConfirm ? (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                    {t('cancelHeading')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {t('cancelText')}
                  </p>
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    {t('cancelButton')}
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-950/40 rounded-2xl p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2.5 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-700 dark:text-red-400">
                        {t('confirmHeading')}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                        {t('confirmText')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      {t('keepSubscription')}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {cancelling ? t('cancellingStatus') : t('confirmCancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
