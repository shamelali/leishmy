import { Scale } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Leish!",
  description:
    "Terms and conditions governing your use of Leish, a beauty services marketplace.",
};

const sections = [
  {
    title: "What Leish Is",
    content:
      "Leish is a marketplace connecting clients with independent makeup artists (MUAs) and studio spaces. Leish facilitates discovery, booking, and payment, but is not itself a beauty service provider. MUAs and studios listed on the Platform are independent third parties, not employees or agents of Leish.",
  },
  {
    title: "Eligibility",
    content:
      "You must be at least 18 years old, or the age of majority in your jurisdiction, to create an account. By registering, you confirm the information you provide is accurate and that you have the right to enter into these Terms.",
  },
  {
    title: "Accounts",
    content:
      "\u2022 You are responsible for maintaining the confidentiality of your login credentials.\n\u2022 You must notify us promptly of any unauthorised use of your account.\n\u2022 Leish reserves the right to suspend or terminate accounts that violate these Terms, provide false information, or engage in fraudulent activity.",
  },
  {
    title: "Bookings & Payments",
    content:
      "\u2022 All bookings must be made and paid for through the Platform. Payments are held in escrow and released to the MUA/studio per the Cancellation & Refund Policy.\n\u2022 Leish commission rates: 12% on client-to-MUA bookings, 15% on client-to-studio bookings, 20% on MUA studio rentals arranged via Leish.\n\u2022 Prices listed by MUAs and studios are set independently by them; Leish does not set service pricing.",
  },
  {
    title: "Off-Platform Contact",
    content:
      "To protect payment security and dispute resolution for both parties, clients and providers agree not to arrange payment or solicit bookings outside the Platform for services discovered via Leish, until a booking has been completed. Violations may result in account suspension.",
  },
  {
    title: "Cancellations & Refunds",
    content:
      "Governed by the Leish Cancellation & Refund Policy, incorporated into these Terms by reference.",
  },
  {
    title: "Provider Standards (MUAs & Studios)",
    content:
      "\u2022 Providers must accurately represent their qualifications, portfolio, and services.\n\u2022 Providers must honour confirmed bookings and arrive on time or provide reasonable notice of delay.\n\u2022 Providers must maintain appropriate hygiene and safety standards for beauty services.\n\u2022 Leish reserves the right to review, suspend, or remove provider listings that violate these standards or receive repeated valid complaints.",
  },
  {
    title: "Prohibited Conduct",
    content:
      "\u2022 Circumventing the Platform to avoid commission\n\u2022 Posting false, misleading, or infringing content\n\u2022 Harassment, discrimination, or abusive behaviour toward other users\n\u2022 Attempting to interfere with the security or operation of the Platform",
  },
  {
    title: "Intellectual Property",
    content:
      "The Leish name, logo, and Platform design are the property of Duta Integra Solutions. Content you upload (portfolio images, profile text) remains your property, but you grant Leish a licence to display it on the Platform for the purpose of operating the marketplace.",
  },
  {
    title: "Disclaimers & Limitation of Liability",
    content:
      "Leish provides the Platform on an \u201cas is\u201d basis and does not guarantee the quality of services performed by independent MUAs or studios. To the maximum extent permitted by Malaysian law, Leish\u2019s liability for any claim arising from a booking is limited to the amount paid for that booking. Leish is not liable for indirect, incidental, or consequential damages.",
  },
  {
    title: "Dispute Resolution",
    content:
      "Disputes between clients and providers are handled per the Cancellation & Refund Policy. Disputes between a user and Leish shall first be attempted to be resolved informally via support@leish.my. Unresolved disputes are subject to the exclusive jurisdiction of the courts of Malaysia.",
  },
  {
    title: "Governing Law",
    content:
      "These Terms are governed by the laws of Malaysia.",
  },
  {
    title: "Changes to These Terms",
    content:
      "We may update these Terms from time to time. Material changes will be notified via email or in-app notice at least 7 days before taking effect. Continued use after changes take effect constitutes acceptance.",
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <Scale className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Terms of Service
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
