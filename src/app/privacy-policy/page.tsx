import { Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Leish!",
  description:
    "How Leish collects, uses, and protects your personal data in accordance with Malaysia's PDPA 2010.",
};

const sections = [
  {
    title: "Who We Are",
    content:
      "Duta Integra Solutions is a Sole Proprietorship registered under the Registration of Businesses Act 1956, registered address F2-22-15 Tamarind Suites, Tamarind Square, Persiaran Multimedia, Cyber 11, 63000 Cyberjaya, Selangor, Malaysia.",
  },
  {
    title: "Data We Collect",
    content:
      "Provided directly by you:\n\u2022 Account details: name, email, phone number, password (hashed)\n\u2022 Profile details (MUAs/studios): portfolio images, service listings, pricing, location, business registration details where applicable\n\u2022 Booking details: appointment date/time, service selected, special requests, location for mobile services\n\u2022 Payment details: processed by Billplz and HitPay \u2014 Leish does not store full card numbers\n\u2022 Communications: in-app chat messages, support enquiries\n\nCollected automatically:\n\u2022 Device and usage data: IP address, browser type, pages visited, referral source\n\u2022 Cookies and similar technologies for session management and analytics",
  },
  {
    title: "How We Use Your Data",
    content:
      "\u2022 To create and manage your account and provider/client profile\n\u2022 To process bookings and payments, including escrow holding and release\n\u2022 To send booking confirmations, reminders, and service-related notifications (via Brevo)\n\u2022 To detect and prevent off-platform contact circumvention, fraud, and policy violations\n\u2022 To respond to support enquiries and resolve disputes\n\u2022 To improve the Platform through aggregated, anonymised analytics\n\u2022 To comply with legal obligations, including tax and business record-keeping requirements",
  },
  {
    title: "Who We Share Data With",
    content:
      "We do not sell personal data. We share limited data only where necessary:\n\n\u2022 Between client and MUA/studio: contact and booking details needed to fulfil a confirmed booking\n\u2022 Payment processors: Billplz and HitPay, to process transactions\n\u2022 Infrastructure providers: Supabase (database/auth), Vercel (hosting), Cloudflare (DNS/security), Brevo (email), Sentry (error monitoring)\n\u2022 Legal or regulatory authorities, where required by Malaysian law",
  },
  {
    title: "Data Retention",
    content:
      "We retain account and booking data for as long as your account is active, and for a reasonable period afterward to meet legal, accounting, and dispute-resolution obligations (generally up to 7 years for financial records, consistent with Malaysian tax requirements). You may request earlier deletion subject to Section 7.",
  },
  {
    title: "Data Security",
    content:
      "We apply reasonable technical and organisational measures to protect your data, including encrypted connections (HTTPS), row-level security on our database, and restricted access to production systems. No system is completely secure, and we encourage you to use a strong, unique password.",
  },
  {
    title: "Your Rights Under the PDPA",
    content:
      "Subject to the PDPA, you may:\n\n\u2022 Request access to the personal data we hold about you\n\u2022 Request correction of inaccurate data\n\u2022 Withdraw consent to certain processing (e.g. marketing communications)\n\u2022 Request deletion of your account, subject to our legal retention obligations\n\nTo exercise these rights, email support@leish.my. We aim to respond within 21 days as required by the PDPA.",
  },
  {
    title: "Cookies",
    content:
      "We use essential cookies for login sessions and basic analytics cookies to understand Platform usage. You can control cookies through your browser settings; disabling essential cookies may affect Platform functionality.",
  },
  {
    title: "Children\u2019s Data",
    content:
      "Leish is not directed at individuals under 18. We do not knowingly collect data from minors. If you believe a minor has provided us data, contact support@leish.my for removal.",
  },
  {
    title: "Changes to This Policy",
    content:
      "We may update this policy periodically. Material changes will be notified via email or in-app notice at least 7 days before taking effect.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Privacy Policy
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
            F2-22-15 Tamarind Suites, Tamarind Square, Persiaran Multimedia,
            Cyber 11, 63000 Cyberjaya, Selangor, Malaysia
          </p>
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
