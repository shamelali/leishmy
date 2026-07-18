"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Check, Sparkles, Star, Clock, MessageCircle, HeadphonesIcon, Gift, Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";

const BENEFITS = [
  {
    icon: Star,
    title: "Priority Booking",
    description: "Skip the queue and get first access to top artists and studios before everyone else.",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    icon: Zap,
    title: "Exclusive Discounts",
    description: "Enjoy special member-only pricing on all services across the platform.",
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/40",
  },
  {
    icon: Clock,
    title: "Free Rescheduling",
    description: "Change your appointments anytime, anywhere with zero fees — unlimited rescheduling.",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    icon: MessageCircle,
    title: "AI Beauty Consultations",
    description: "Get personalised beauty advice powered by AI — product recommendations, style tips, and more.",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/40",
  },
  {
    icon: HeadphonesIcon,
    title: "Faster Support",
    description: "Priority customer support with faster response times. We're here for you around the clock.",
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/40",
  },
  {
    icon: Gift,
    title: "Birthday Perks",
    description: "Celebrate your birthday with exclusive rewards, bonus loyalty points, and special treats.",
    color: "text-pink-500",
    bg: "bg-pink-50 dark:bg-pink-950/40",
  },
];

export default function LeishPlusPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetch("/api/subscriptions?action=plans")
      .then((r) => r.json())
      .then((data) => {
        const popular = data.plans?.find((p: any) => p.popular);
        setPlan(popular || data.plans?.[0] || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!plan) return;
    setSubscribing(true);

    try {
      const res = await fetch("/api/subscriptions?action=create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong");
        return;
      }

      if (data.bill?.url) {
        window.location.href = data.bill.url;
      }
    } catch {
      console.error("Failed to initiate subscription");
      alert("Failed to initiate subscription");
    } finally {
      setSubscribing(false);
    }
  };

  const pricePerMonth = plan ? (plan.price / 100).toFixed(0) : "29";
  const pricePerDay = plan ? (plan.price / 100 / 30).toFixed(1) : "1.0";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white dark:from-neutral-950 dark:via-rose-950/10 dark:to-neutral-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-rose-100 dark:from-amber-900/30 dark:to-rose-900/30 border border-amber-200/60 dark:border-amber-700/60 mb-6">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Introducing Leish+
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
            The VIP Way to{" "}
            <span className="bg-gradient-to-r from-amber-500 to-rose-600 bg-clip-text text-transparent">
              Beauty
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock the ultimate beauty experience with priority access, exclusive savings, and
            personalised perks.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto mb-20">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-rose-500 to-pink-500 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="relative bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-8 shadow-2xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-rose-600 text-white text-xs font-bold rounded-full">
                BEST VALUE
              </div>
              {loading ? (
                <div className="space-y-4 py-4">
                  <div className="h-6 w-3/4 mx-auto bg-gray-200 dark:bg-neutral-800 rounded animate-pulse" />
                  <div className="h-4 w-1/2 mx-auto bg-gray-200 dark:bg-neutral-800 rounded animate-pulse" />
                  <div className="h-12 w-1/3 mx-auto bg-gray-200 dark:bg-neutral-800 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 dark:bg-neutral-800 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {plan?.name || "Leish+ Monthly"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {plan?.description || "All premium features included"}
                    </p>
                  </div>
                  <div className="text-center mb-8">
                    <span className="text-5xl font-black text-gray-900 dark:text-white">
                      RM{pricePerMonth}
                    </span>
                    <span className="text-lg text-gray-500 dark:text-gray-400">/month</span>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Less than RM{pricePerDay}/day
                    </p>
                  </div>
                  <button
                    onClick={handleSubscribe}
                    disabled={subscribing || authLoading}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold rounded-2xl hover:from-amber-600 hover:to-rose-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {subscribing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : user ? (
                      "Get Leish+ Now"
                    ) : (
                      "Sign In to Subscribe"
                    )}
                  </button>
                  <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
                    Secure payment via Billplz. Cancel anytime.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Everything included in Leish+
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="group bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-6 hover:shadow-lg hover:border-rose-200 dark:hover:border-rose-800 transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${benefit.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div className="max-w-2xl mx-auto mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Leish+ vs Free
          </h2>
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-neutral-800">
                  <th className="text-left py-4 px-6 text-gray-500 dark:text-gray-400 font-medium">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4 text-gray-400 font-medium">Free</th>
                  <th className="text-center py-4 px-4 text-rose-600 dark:text-rose-400 font-bold">
                    Leish+
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {[
                  { label: "Booking Access", free: "Standard queue", plus: "Priority queue" },
                  { label: "Discounts", free: "None", plus: "Exclusive member pricing" },
                  { label: "Rescheduling", free: "Charges apply", plus: "Free & unlimited" },
                  { label: "AI Beauty Consultations", free: "Limited", plus: "Full access" },
                  { label: "Customer Support", free: "Standard (24-48h)", plus: "Priority (&lt;4h)" },
                  { label: "Birthday Perks", free: "Basic", plus: "Premium rewards" },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="py-3.5 px-6 text-gray-900 dark:text-white font-medium">
                      {row.label}
                    </td>
                    <td className="text-center py-3.5 px-4 text-gray-400">{row.free}</td>
                    <td className="text-center py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                        <Check className="w-4 h-4" /> {row.plus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "How does the subscription work?",
                a: "Once you subscribe, you'll be redirected to Billplz for secure payment. After payment is confirmed, your Leish+ benefits are activated immediately for 30 days.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes! You can cancel from your subscription settings at any time. Your benefits will remain active until the end of your current billing period.",
              },
              {
                q: "How do I use priority booking?",
                a: "Leish+ members get priority access when booking popular artists and studios. Your membership badge will be visible on your profile, and booking requests will be flagged as priority.",
              },
              {
                q: "What kind of AI beauty consultations?",
                a: "Our AI assistant provides personalised product recommendations, style matching, skin analysis, and beauty tips based on your profile and preferences.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
