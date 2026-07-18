"use client";

import { useState, useEffect } from "react";
import { Share2, Copy, Check, Link as LinkIcon, Users, MousePointerClick, Gift, Download } from "lucide-react";
import QRCode from "qrcode";

interface ShareInfo {
  profile: { name: string; slug: string; type: string };
  shareLink: string;
  stats: { clicks: number; referrals: number; pointsEarned: number };
  recent: Array<{
    id: number;
    status: string;
    referredEmail: string | null;
    pointsAwarded: number | null;
    clickedAt: string;
    bookedAt: string | null;
    rewardedAt: string | null;
  }>;
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <span className="text-sm text-gray-500 dark:text-neutral-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function StudioSharePage() {
  const [data, setData] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/referrals/share-info?role=studio");
        if (!res.ok) {
          if (res.status === 404) throw new Error("Studio profile not found. Complete your studio setup first.");
          throw new Error("Failed to load share info");
        }
        const json = await res.json();
        if (cancelled) return;
        setData(json);
        QRCode.toDataURL(json.shareLink, {
          width: 300,
          margin: 2,
          color: { dark: "#1a1a2e", light: "#ffffff" },
        }).then(setQrDataUrl);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const copyLink = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const shareWhatsApp = () => {
    if (!data) return;
    const text = encodeURIComponent(`Check out my studio on Leish! 🎨\n${data.shareLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `leish-share-${data?.profile.slug || "qrcode"}.png`;
    a.click();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 dark:bg-neutral-800 rounded" />
        <div className="h-32 bg-gray-200 dark:bg-neutral-800 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-neutral-800 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
          <p className="text-amber-800 dark:text-amber-200">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Share & Refer</h1>
        <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
          Share your studio profile and earn 200 points per referral booking
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <label className="text-xs text-white/70 uppercase tracking-wider font-medium">Your share link</label>
            <div className="mt-1 flex items-center gap-2 bg-white/15 rounded-lg px-4 py-3">
              <LinkIcon className="w-4 h-4 shrink-0" />
              <code className="text-sm font-mono truncate">{data.shareLink}</code>
            </div>
            <p className="text-xs text-white/60 mt-2">
              Share this link on WhatsApp, Instagram, or your business cards
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-purple-700 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={shareWhatsApp}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg font-medium text-sm hover:bg-green-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={MousePointerClick} label="Link Clicks" value={data.stats.clicks} sub="Total clicks on your share link" />
        <StatCard icon={Users} label="Referrals" value={data.stats.referrals} sub="Clients who booked through you" />
        <StatCard icon={Gift} label="Points Earned" value={data.stats.pointsEarned} sub="200 points per referral booking" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6 text-center">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">QR Code</h3>
            {qrDataUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Share QR Code" className="mx-auto w-48 h-48" />
                <button
                  onClick={downloadQr}
                  className="mt-4 inline-flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
              </>
            ) : (
              <div className="w-48 h-48 mx-auto bg-gray-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
            )}
            <p className="text-xs text-gray-400 mt-3">
              Print this QR code for business cards, flyers, or studio display
            </p>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800 p-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            {data.recent.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Share2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activity yet. Start sharing your link!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recent.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-neutral-800 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        r.status === "rewarded" ? "bg-green-500" :
                        r.status === "booked" ? "bg-blue-500" :
                        r.status === "registered" ? "bg-yellow-500" :
                        "bg-gray-300"
                      }`} />
                      <span className="text-sm text-gray-600 dark:text-neutral-300 truncate">
                        {r.referredEmail || "Anonymous"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-400 capitalize">
                        {r.status === "rewarded" ? "Rewarded" : r.status}
                      </span>
                      {r.pointsAwarded && (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          +{r.pointsAwarded} pts
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">
          💡 How it works
        </h3>
        <ol className="text-sm text-purple-700 dark:text-purple-300 space-y-1.5 list-decimal list-inside">
          <li>Share your link <code className="text-xs bg-purple-100 dark:bg-purple-900/40 px-1 rounded">{data.shareLink}</code> with clients</li>
          <li>When they click and book within 30 days, you earn <strong>200 loyalty points</strong></li>
          <li>Points unlock rewards like priority booking, exclusive events, and more</li>
        </ol>
      </div>
    </div>
  );
}
