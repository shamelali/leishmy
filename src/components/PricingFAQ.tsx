"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    q: "What is included in each plan?",
    a: "Each plan includes different levels of access to Leish! features. Free gives you a basic profile with standard queue access. Pro adds priority booking, unlimited services, analytics, and featured placement. Business includes everything in Pro plus API access, multi-studio management, and a dedicated account manager.",
  },
  {
    q: "How do commissions work?",
    a: "Leish! takes a commission on each booking processed through the platform. Free plan: 12%, Pro plan: 8%, Business plan: 5%. The commission is automatically deducted from the payment and the remainder is released to the artist or studio.",
  },
  {
    q: "Can I upgrade or downgrade my plan?",
    a: "Yes! You can upgrade or downgrade your plan at any time from your dashboard. Changes take effect at the start of your next billing cycle. There are no lock-in contracts or cancellation fees.",
  },
  {
    q: "How do I pay for Pro and Business plans?",
    a: "Pro and Business plans are billed monthly via secure payment processing through Billplz. You can pay using credit card, online banking, or other supported payment methods in Malaysia.",
  },
  {
    q: "Is there a free trial?",
    a: "The Free plan is available indefinitely at no cost. Pro and Business plans do not offer a free trial, but you can switch plans anytime. If you need a trial for Business, please contact our sales team.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major credit cards, online banking, and e-wallets through Billplz, Malaysia's leading payment gateway. All transactions are processed securely and Leish! never stores your full card details.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes, you can cancel your Pro or Business subscription at any time. Your benefits will remain active until the end of your current billing period. You can resubscribe anytime.",
  },
];

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <details
          key={faq.q}
          className="group bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden"
          open={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
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
  );
}