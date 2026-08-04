"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Share2, Copy, Check, Users, MousePointerClick, CalendarCheck, Gift, ArrowLeft, Sparkles, TrendingUp, ExternalLink } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import { useAuth } from "@/context/AuthContext";

interface ReferralStats {
  clicks: number;
  registrations: number;
  bookings: number;
  rewarded: number;
  pointsEarned: number;
}

interface ReferralRow {
  id: number;
  referrerType: string;
  referredUserId: string | null;
  referredEmail: string | null;
  status: string;
  pointsAwarded: number;
  clickedAt: string;
  registeredAt: string | null;
  bookedAt: string | null;
  rewardedAt: string | null;
}

interface ShareInfo {
  shareLink: string;
  stats: ReferralStats;
  recent: ReferralRow[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
  clicked: { label: "Clicked", color: "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400" },
  registered: { label: "Registered", color: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" },
  booked: { label: "Booked", color: "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" },
  rewarded: { label: "Rewarded", color: "bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400" },
};

export default function ReferralsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState<"artist" | "studio">("artist");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/referrals/share-info?role=${role}`);
        if (res.ok && !cancelled) {
          const info = await res.json();
          setData(info);
        }
      } catch {
        // silent
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user, role]);

  const handleCopy = async () => {
    if (!data?.shareLink) return;
    await navigator.clipboard.writeText(data.shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Referral Program</h2>
        <p className="text-gray-500 mb-6">Sign in to access your referral link and track rewards.</p>
        <Link href="/login" className="text-sm font-medium text-rose-500 hover:text-rose-600">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/rewards" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Rewards
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Refer & Earn</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Share your link. When someone books, you earn 200 bonus points.
        </p>
      </div>

      {/* Role Toggle */}
      <div className="flex gap-2 mb-6">
        {(["artist", "studio"] as const).map((r) => (
          <button
            key={r}
            onClick={() => { setRole(r); setLoading(true); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              role === r
                ? "bg-rose-500 text-white"
                : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700"
            }`}
          >
            {r === "artist" ? "As Artist" : "As Studio"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : !data ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Could not load referral data.</p>
        </div>
      ) : (
        <>
          {/* Share Link Card */}
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 mb-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-5 h-5" />
              <h2 className="text-sm font-semibold uppercase tracking-wide">Your Referral Link</h2>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-3 mb-4">
              <code className="flex-1 text-sm truncate">{data.shareLink}</code>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={data.shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Link
              </a>
              <span className="text-xs text-white/60">Share via WhatsApp, Instagram, or any platform</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { icon: MousePointerClick, label: "Clicks", value: data.stats.clicks, color: "text-blue-500" },
              { icon: Users, label: "Registered", value: data.stats.registrations, color: "text-violet-500" },
              { icon: CalendarCheck, label: "Bookings", value: data.stats.bookings, color: "text-amber-500" },
              { icon: Gift, label: "Points Earned", value: data.stats.pointsEarned, color: "text-green-500" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl p-4 text-center">
                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1.5`} />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* How It Works */}
          <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <div className="space-y-4">
              {[
                { step: "1", title: "Share your link", desc: "Send your unique referral link to friends" },
                { step: "2", title: "They sign up", desc: "New user registers through your link" },
                { step: "3", title: "They book", desc: "New user makes their first booking" },
                { step: "4", title: "You earn points", desc: "Get 200 points (x tier multiplier) added to your balance" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{item.step}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Referrals */}
          {data.recent.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-neutral-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Referrals</h2>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-neutral-800/50">
                {data.recent.map((ref) => {
                  const cfg = statusConfig[ref.status] || statusConfig.clicked;
                  return (
                    <div key={ref.id} className="px-6 py-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {ref.referredEmail || `User #${ref.referredUserId || ref.id}`}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(ref.clickedAt).toLocaleDateString("en-MY")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {ref.pointsAwarded > 0 && (
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">+{ref.pointsAwarded}</span>
                        )}
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
