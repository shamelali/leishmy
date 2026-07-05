import { RotateCcw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy — Leish!",
  description:
    "How cancellations, no-shows, and refunds are handled for bookings made through Leish.",
};

const sections = [
  {
    title: "How Payments Work",
    content:
      "All bookings are paid for in advance through Leish and held in escrow. Funds are only released to the MUA or studio after the appointment has been marked complete, or after the applicable dispute window has passed without a reported issue.",
  },
  {
    title: "Client Cancellations",
    content:
      "More than 48 hours before the appointment: Full refund, less any payment gateway processing fee already incurred. Refunds are returned to the original payment method within 5\u201310 business days.\n\nBetween 48 and 24 hours before the appointment: 50% refund. The remaining 50% is paid to the MUA or studio as compensation for the reserved time slot, which can no longer be resold on short notice.\n\nLess than 24 hours before the appointment, or no-show: No refund. The full booking amount is released to the MUA or studio.\n\nExceptions: Medical emergencies, bereavement, or other serious circumstances may be reviewed on a case-by-case basis at Leish\u2019s discretion upon supporting documentation. Contact support@leish.my.",
  },
  {
    title: "MUA / Studio Cancellations",
    content:
      "If an MUA or studio cancels a confirmed booking for any reason:\n\n\u2022 The client receives a 100% refund, including any processing fees.\n\u2022 Leish will attempt to help the client rebook with another available artist or studio for the same date and time where possible.\n\u2022 Repeated cancellations by the same MUA or studio (3 or more within a rolling 90-day period) may result in suspension from the Platform under Leish\u2019s provider standards.",
  },
  {
    title: "Late Arrivals",
    content:
      "If an MUA or studio arrives more than 30 minutes late without prior notice to the client, the client may cancel on-site for a full refund. If the client is more than 30 minutes late without notice, this is treated as a no-show.",
  },
  {
    title: "Service Disputes",
    content:
      "If a client believes the service delivered was materially different from what was booked (e.g. wrong service performed, artist did not show the qualifications listed, safety or hygiene concern):\n\n\u2022 Report the issue to support@leish.my within 48 hours of the appointment, with photos or details where possible.\n\u2022 Leish will review the claim and may contact both parties for information.\n\u2022 Disputes are typically resolved within 2 business days of all information being received.\n\u2022 Leish\u2019s decision on fund release is final for disputes under RM 500. For higher-value disputes, either party may escalate to mediation before the Selangor Consumer Claims Tribunal.\n\nLeish acts as a neutral marketplace facilitator. We are not a party to the underlying service contract between client and MUA/studio, but we hold payment in escrow specifically to make fair resolution possible.",
  },
  {
    title: "Studio Rental Bookings",
    content:
      "The cancellation windows above apply equally when an MUA books a studio space through Leish. The 20% Leish commission on this transaction type is non-refundable once the studio confirms the booking, as it covers Leish\u2019s facilitation and payment processing regardless of later cancellation.",
  },
  {
    title: "How to Request a Refund or Cancellation",
    content:
      "\u2022 Log in to your Leish account and go to your booking under \u201cMy Bookings.\u201d\n\u2022 Select \u201cCancel Booking\u201d and follow the prompts \u2014 refund eligibility is calculated automatically based on time remaining.\n\u2022 For disputes or exceptions, email support@leish.my with your booking reference number.",
  },
  {
    title: "Changes to This Policy",
    content:
      "Leish may update this policy from time to time. Material changes will be notified via email or in-app notice at least 7 days before taking effect. Continued use of the Platform after changes take effect constitutes acceptance.",
  },
];

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <RotateCcw className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Cancellation &amp; Refund Policy
          </h1>
          <p className="text-gray-500 mt-2">
            Operated by Duta Integra Solutions (TR0325441-K)
          </p>
        </div>
        <div className="space-y-6">
          {sections.map((section, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                {section.title}
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Duta Integra Solutions (TR0325441-K)</p>
          <p>
            <a
              href="mailto:support@leish.my"
              className="text-rose-500 hover:text-rose-600 underline underline-offset-4"
            >
              support@leish.my
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
