import { FileText, Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Leish!",
  description: "Leish! privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <Shield className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
          <p className="text-gray-500 mt-2">Last updated: July 2026</p>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
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
    title: "Information We Collect",
    content: "We collect information you provide when creating an account, making a booking, or contacting support. This includes your name, email address, phone number, and payment information. We also collect usage data such as pages visited and interactions with the platform.",
  },
  {
    title: "How We Use Your Information",
    content: "Your information is used to facilitate bookings, process payments, send notifications about your appointments, and improve our services. We may send occasional emails about platform updates or new features, which you can opt out of at any time.",
  },
  {
    title: "Data Sharing",
    content: "We share necessary information with artists and studios to fulfill bookings (name, contact details, booking preferences). Payment information is processed securely by Billplz and is not stored on our servers. We do not sell your personal data to third parties.",
  },
  {
    title: "Data Security",
    content: "We implement industry-standard security measures including encryption in transit and at rest, secure authentication, and regular security audits. However, no method of transmission over the Internet is 100% secure.",
  },
  {
    title: "Your Rights",
    content: "You have the right to access, correct, or delete your personal data at any time through your account settings. You may also request a copy of your data or ask us to delete your account by contacting support.",
  },
  {
    title: "Contact",
    content: "If you have questions about this privacy policy, please contact us at hello@leish.my.",
  },
];
