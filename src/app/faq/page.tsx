import { HelpCircle, ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Leish!",
  description:
    "Answers to common questions about booking makeup artists and studios on Leish.",
};

type FaqItem = { q: string; a: string };
type FaqGroup = { title: string; items: FaqItem[] };

const FAQ_GROUPS: FaqGroup[] = [
  {
    title: "Booking & Payments",
    items: [
      {
        q: "How does booking work on Leish?",
        a: "Browse a makeup artist or studio profile, pick a service and available time slot, and pay through the platform. Your payment is held in escrow and only released to the artist after your appointment is completed \u2014 you\u2019re never paying a stranger directly.",
      },
      {
        q: "What payment methods are supported?",
        a: "We support FPX bank transfer, credit/debit card, and e-wallets via Billplz. All payments are processed securely and Leish never stores your card details.",
      },
      {
        q: "What happens if I need to cancel?",
        a: "Cancellations made more than 48 hours before your appointment are fully refunded. Cancellations within 48 hours may be subject to a partial charge to compensate the artist\u2019s reserved time. See our Cancellation & Refund Policy for full details.",
      },
      {
        q: "What if my artist cancels on me?",
        a: "You\u2019ll receive a full refund automatically, and our team will help you rebook with another available artist for the same date if possible.",
      },
    ],
  },
  {
    title: "Finding & Choosing an Artist",
    items: [
      {
        q: "How do I know an artist is legitimate?",
        a: "Every artist profile shows a real portfolio, service pricing, and verified booking history on the platform. Profiles pending review are not shown in public search results.",
      },
      {
        q: "Can I message an artist before booking?",
        a: "Yes \u2014 use in-app chat to ask about availability, style, or specific requests. For your safety and to keep your booking protected, all communication should stay within Leish rather than moving to WhatsApp or Instagram before a booking is confirmed.",
      },
      {
        q: "Can I book a studio space instead of a mobile artist?",
        a: "Yes. Studios list their own space, team, and services separately \u2014 browse the Studios tab to see options near you.",
      },
    ],
  },
  {
    title: "For Makeup Artists",
    items: [
      {
        q: "How much does Leish take in commission?",
        a: "Leish charges 12% commission on client-to-artist bookings, 15% on client-to-studio bookings, and 20% when an artist rents an external studio through the platform. There are no subscription fees \u2014 you only pay when you earn.",
      },
      {
        q: "When do I get paid?",
        a: "Payouts are released after the appointment is marked complete, typically within 3\u20135 business days to your registered bank account.",
      },
      {
        q: "How do I become a Leish Pro artist?",
        a: "Complete your profile with a full portfolio and verified availability, then apply for Pro from your dashboard. Pro unlocks advanced scheduling, automated reminders, and priority placement in search.",
      },
    ],
  },
  {
    title: "Trust & Safety",
    items: [
      {
        q: "Is my payment protected?",
        a: "Yes. Leish uses an escrow model \u2014 your payment is held by Leish and only released to the artist or studio after the service is completed, giving both sides protection against no-shows or disputes.",
      },
      {
        q: "What if something goes wrong during my appointment?",
        a: "Contact our support team immediately at support@leish.my or through in-app chat. Disputes are reviewed within 2 business days \u2014 see our Cancellation & Refund Policy for the full resolution process.",
      },
      {
        q: "How is my personal data handled?",
        a: "We only collect what\u2019s needed to run your bookings and communications. Read our full Privacy Policy for details on what we collect, how it\u2019s used, and your rights under Malaysia\u2019s PDPA 2010.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <HelpCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-500 mt-2">
            Answers to common questions about booking makeup artists and
            studios on Leish.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Can&#39;t find what you&#39;re looking for?{" "}
            <a
              href="mailto:support@leish.my"
              className="text-rose-500 hover:text-rose-600 underline underline-offset-4"
            >
              Email support@leish.my
            </a>
          </p>
        </div>

        <div className="space-y-10">
          {FAQ_GROUPS.map((group) => (
            <section key={group.title}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {group.title}
              </h2>
              <div className="space-y-3">
                {group.items.map((item, i) => (
                  <details
                    key={item.q}
                    className="group bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden"
                  >
                    <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                      <span className="font-medium text-gray-900 dark:text-white text-sm pr-4">
                        {item.q}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-5 pb-5 border-t border-gray-100 dark:border-neutral-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400 pt-3 leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 text-center border-t border-gray-200 dark:border-neutral-800 pt-10">
          <p className="text-sm text-gray-500">
            Still need help?{" "}
            <Link
              href="/contact"
              className="text-rose-500 hover:text-rose-600 underline underline-offset-4"
            >
              Contact us
            </Link>{" "}
            or email{" "}
            <a
              href="mailto:support@leish.my"
              className="text-rose-500 hover:text-rose-600 underline underline-offset-4"
            >
              support@leish.my
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
