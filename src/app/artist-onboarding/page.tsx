"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Camera,
  Package,
  CreditCard,
  MessageCircle,
  ClipboardList,
  LifeBuoy,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";

const phases = [
  {
    icon: Camera,
    titleKey: "phase1Title",
    items: [
      {
        title: "High-Resolution Portfolio",
        content:
          "In the luxury segment, your portfolio is your most valuable asset.",
        details: [
          "Hero Image: Your primary photo must be a professional, high-resolution shot. Avoid heavy filters; focus on clean skin and technical precision.",
          "Gallery Variety: Upload 6-10 distinct looks — Natural/Clean Beauty, Full Glam/Evening, Bridal (Traditional & Modern), Editorial/Creative (if applicable).",
          "Consistency: Use consistent lighting (Natural or Ring Light) for all shots to maintain a cohesive brand look on your profile.",
        ],
      },
      {
        title: "Crafting a High-Conversion Bio",
        content: "Don't just list your skills; tell your story.",
        details: [
          'The Hook: Start with your specialty (e.g., "Specializing in timeless, radiant bridal beauty for 10+ years.")',
          "Trust Signals: Mention certifications, notable clients, or collaborations with major brands.",
          'The Philosophy: Why do you do what you do? (e.g., "Committed to enhancing natural features through bespoke artistry.")',
        ],
      },
    ],
  },
  {
    icon: Package,
    titleKey: "phase2Title",
    items: [
      {
        title: "Service Transparency & Pricing",
        content: 'Luxury clients value clarity over "starting at" prices.',
        details: [
          'Descriptive Packages: Instead of "Makeup," use "Signature Bridal Look (Inc. Premium Lashes & Trial)."',
          "Duration Accuracy: Set realistic time slots (e.g., 90 mins for Glam, 120 mins for Bridal). This builds trust when you arrive and finish on time.",
          'Travel Policy: Clearly define your travel radius. If you offer "Home Services," specify any surcharge for locations beyond 20km from Cyberjaya.',
        ],
      },
      {
        title: 'Calendar Management (The "Zero-Rejection" Policy)',
        content:
          "Our platform thrives on real-time bookings. Reliability is the hallmark of luxury.",
        details: [
          "Daily Sync: Ensure your Leish! calendar is synced with your personal Google/iCal.",
          "Instant Booking: If you are listed as available, be ready to honor the booking.",
          "Blockers: Proactively block out personal time, vacations, and external bookings immediately.",
        ],
      },
    ],
  },
  {
    icon: CreditCard,
    titleKey: "phase3Title",
    items: [
      {
        title: "Seamless Transactions",
        content:
          "Leish! handles secure deposits to protect your time and prevent no-shows.",
        details: [
          "Deposit Policy: Leish! handles secure deposits to protect your time and prevent no-shows.",
          "Payment Tiers: Clearly state if you require full payment via the platform or if the balance is due on the day of service.",
          "Cancellation Clarity: Familiarize yourself with our luxury cancellation policy (e.g., 48-hour notice required for full deposit refund).",
        ],
      },
    ],
  },
  {
    icon: MessageCircle,
    titleKey: "phase4Title",
    items: [
      {
        title: "The Leish! Tone of Voice",
        content: "Professionalism extends beyond the brushes.",
        details: [
          "Promptness: Aim to respond to client inquiries via the dashboard within 30-60 minutes.",
          "Consultation: Use the chat feature to ask for reference photos or skin sensitivity information before the appointment.",
          'Post-Service: Always send a "Thank You" message and a polite request for a review. Reviews are the primary driver for future bookings.',
        ],
      },
    ],
  },
];

const checklist = [
  { key: "checklist1", done: false },
  { key: "checklist2", done: false },
  { key: "checklist3", done: false },
  { key: "checklist4", done: false },
  { key: "checklist5", done: false },
  { key: "checklist6", done: false },
];

export default function ArtistOnboarding() {
  const t = useTranslations("artistOnboarding");
  const [openPhase, setOpenPhase] = useState<number | null>(0);
  const [checked, setChecked] = useState<boolean[]>(
    new Array(checklist.length).fill(false),
  );

  const togglePhase = (i: number) => setOpenPhase(openPhase === i ? null : i);
  const toggleCheck = (i: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const allDone = checked.every(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white dark:from-neutral-950 dark:to-neutral-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <Link
            href="/dashboard/artist"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> {t("backToDashboard")}
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {t("heading")}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-6 sm:p-8 mb-8 shadow-sm">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {t("intro")}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {phases.map((phase, i) => {
            const Icon = phase.icon;
            const isOpen = openPhase === i;
            return (
              <div
                key={i}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => togglePhase(i)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">
                        {t("phase", { number: i + 1 })}
                      </span>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t(phase.titleKey)}
                      </h2>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 space-y-6 border-t border-gray-100 dark:border-neutral-800 pt-5">
                    {phase.items.map((item, j) => (
                      <div key={j}>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          {item.content}
                        </p>
                        <ul className="space-y-2">
                          {item.details.map((detail, k) => (
                            <li
                              key={k}
                              className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("checklistHeading")}
            </h2>
            {allDone && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-full ml-auto">
                {t("complete")}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {checklist.map((item, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  checked[i]
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50"
                    : "bg-gray-50 dark:bg-neutral-800/50 border border-gray-100 dark:border-neutral-800 hover:border-rose-200 dark:hover:border-rose-800"
                }`}
              >
                <div
                  onClick={() => toggleCheck(i)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    checked[i]
                      ? "bg-emerald-500 border-emerald-500"
                      : "border-gray-300 dark:border-neutral-600"
                  }`}
                >
                  {checked[i] && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span
                  className={`text-sm font-medium ${checked[i] ? "text-emerald-700 dark:text-emerald-300 line-through" : "text-gray-700 dark:text-gray-200"}`}
                >
                  {t(item.key)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold">{t("supportHeading")}</h2>
          </div>
          <p className="text-white/80 text-sm mb-4">
            {t("supportText")}
          </p>
          <div className="flex flex-wrap gap-3 mb-4">
            <Link
              href="/artist-onboarding/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-rose-600 rounded-xl text-sm font-semibold hover:bg-rose-50 transition-colors"
            >
              <ClipboardList className="w-4 h-4" /> {t("startCta")}
            </Link>
          </div>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://wa.me/601137633788"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/25 transition-colors"
            >
              <span className="text-lg">📞</span> {t("hotline")}
            </a>
            <a
              href="mailto:support@leish.my"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/25 transition-colors"
            >
              <span className="text-lg">✉️</span> support@leish.my
            </a>
            <Link
              href="/dashboard/artist"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/25 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" /> {t("dashboard")}
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-8">
          {t("footer")}
        </p>
      </div>
    </div>
  );
}
