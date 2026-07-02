import { HelpCircle, ChevronDown } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Leish!",
  description: "Frequently asked questions about booking makeup artists and beauty services.",
};

const faqs = [
  { q: "How do I book a makeup artist?", a: "Browse artists, select your preferred makeup artist, choose a date and time, and confirm your booking. Payment is processed securely through Billplz." },
  { q: "Can I cancel or reschedule a booking?", a: "Yes, you can cancel pending bookings from your dashboard. Rescheduling depends on the artist's availability — contact them directly through the platform." },
  { q: "How are payments handled?", a: "Payments are processed via Billplz. Funds are held securely until the service is completed, then released to the artist." },
  { q: "Is my deposit refundable?", a: "Deposit refunds are handled on a case-by-case basis. Please contact support if you need to cancel." },
  { q: "How do I become a makeup artist on Leish?", a: "Sign up as an artist, complete your profile with portfolio images and service listings, and submit for verification." },
  { q: "What areas do you serve?", a: "We currently serve Kuala Lumpur, Petaling Jaya, Bangsar, and surrounding areas in Malaysia." },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <HelpCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h1>
          <p className="text-gray-500 mt-2">Find answers to common questions about booking and using Leish.</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                <span className="font-medium text-gray-900 dark:text-white text-sm pr-4">{faq.q}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-5 pb-5 border-t border-gray-100 dark:border-neutral-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 pt-3">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
