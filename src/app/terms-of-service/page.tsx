import { FileText, Scale } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Leish!",
  description: "Leish! terms of service — rules and guidelines for using the platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <Scale className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
          <p className="text-gray-500 mt-2">Last updated: July 2026</p>
        </div>
        <div className="space-y-6">
          {sections.map((section, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{section.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const sections = [
  {
    title: "Acceptance of Terms",
    content: "By using Leish, you agree to these terms of service. If you do not agree, please do not use the platform.",
  },
  {
    title: "User Accounts",
    content: "You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate information when creating an account.",
  },
  {
    title: "Bookings and Payments",
    content: "Bookings are confirmed once payment is processed. Cancellation policies are set by individual artists and studios. Leish acts as a platform connecting clients with beauty professionals and is not responsible for the quality of services provided.",
  },
  {
    title: "Prohibited Conduct",
    content: "Users may not misuse the platform for unauthorized purposes, including harassment, fraud, or violating any applicable laws. Leish reserves the right to suspend accounts found violating these terms.",
  },
  {
    title: "Limitation of Liability",
    content: "Leish is not liable for any damages arising from the use of the platform or services booked through it. Our total liability is limited to the amount paid for the specific booking giving rise to the claim.",
  },
  {
    title: "Changes to Terms",
    content: "We may update these terms at any time. Users will be notified of material changes via email or platform notification. Continued use after changes constitutes acceptance of the new terms.",
  },
  {
    title: "Contact",
    content: "For questions about these terms, contact us at hello@leish.my.",
  },
];
