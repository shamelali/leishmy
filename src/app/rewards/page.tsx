"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Award, Gift, TrendingUp, Star, ChevronRight, Clock, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Skeleton from "@/components/Skeleton";

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  bronze: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", icon: "🥉" },
  silver: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", border: "border-gray-300 dark:border-gray-600", icon: "🥈" },
  gold: { bg: "bg-yellow-50 dark:bg-yellow-950/40", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-200 dark:border-yellow-800", icon: "🥇" },
  platinum: { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800", icon: "💎" },
};

export default function RewardsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [points, setPoints] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tierInfo, setTierInfo] = useState<any>(null);
  const [nextTier, setNextTier] = useState<any>(null);
  const [allTiers, setAllTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (!user) return;

    fetch(`/api/loyalty?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        setPoints(data.points);
        setTransactions(data.transactions || []);
        setTierInfo(data.tierInfo);
        setNextTier(data.nextTier);
        setAllTiers(data.allTiers || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tier = points?.tier || "bronze";
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.bronze;
  const pointsToNext = nextTier ? nextTier.minPoints - (points?.lifetimeEarned || 0) : 0;
  const progress = nextTier
    ? Math.min(100, ((points?.lifetimeEarned || 0) / nextTier.minPoints) * 100)
    : 100;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Award className="w-6 h-6 text-rose-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leish Rewards</h1>
        </div>

        {/* Tier Card */}
        <div className={`relative overflow-hidden rounded-3xl border-2 ${tierColor.border} ${tierColor.bg} p-8 mb-8`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-4xl mr-2">{tierColor.icon}</span>
                <span className={`text-2xl font-bold ${tierColor.text} capitalize`}>{tier}</span>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-black ${tierColor.text}`}>{points?.balance || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">points available</p>
              </div>
            </div>

            {nextTier ? (
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {pointsToNext} pts to {nextTier.name}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-3 bg-white/60 dark:bg-neutral-800/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Maximum tier reached!</p>
            )}
          </div>
        </div>

        {/* Tier Perks */}
        {tierInfo?.perks && (
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-6 mb-8 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Gift className="w-4 h-4 text-rose-500" /> Your {tier.charAt(0).toUpperCase() + tier.slice(1)} Perks
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {tierInfo.perks.map((perk: string) => (
                <div key={perk} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-neutral-800 text-sm text-gray-700 dark:text-gray-300">
                  <Star className="w-4 h-4 text-rose-500 shrink-0" />
                  {perk}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Tiers */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">All Tiers</h2>
          <div className="space-y-3">
            {allTiers.map((t) => {
              const tc = TIER_COLORS[t.name] || TIER_COLORS.bronze;
              const isCurrent = t.name === tier;
              return (
                <div
                  key={t.name}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? `${tc.bg} ${tc.border}`
                      : "border-gray-100 dark:border-neutral-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tc.icon}</span>
                    <div>
                      <p className={`text-sm font-bold capitalize ${isCurrent ? tc.text : "text-gray-900 dark:text-white"}`}>
                        {t.name}
                        {isCurrent && <span className="ml-2 text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">Current</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t.minPoints.toLocaleString()} pts &middot; {Number(t.multiplier).toFixed(2)}x multiplier
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isCurrent ? tc.text : "text-gray-300 dark:text-neutral-600"}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Points History */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-rose-500" /> Points History
          </h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No points activity yet. Book an artist or leave a review to start earning!
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${tx.type === "earned" ? "bg-green-500" : "bg-red-400"}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {tx.source.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === "earned" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                    {tx.type === "earned" ? "+" : ""}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
