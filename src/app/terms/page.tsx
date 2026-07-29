import "server-only";

export const metadata = {
  title: "Terms & Conditions — Leish",
  description: "Leish booking terms and conditions",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Terms & Conditions
      </h1>

      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            1. Deposits and Payment
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Bridal &amp; large packages require a 50% non-refundable deposit at
              the time of booking. The remaining 50% is due 7 days before the
              wedding date.
            </li>
            <li>
              Event Glam / Personal Makeup requires a 30% non-refundable deposit
              upfront. The balance is paid on-site via QR code after the service.
            </li>
            <li>
              Trial Sessions require 100% payment upfront at the time of
              booking.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            2. Cancellation &amp; No-Show Policy
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Cancellations made more than 48 hours before the booking are
              eligible for a full refund of any deposits paid.
            </li>
            <li>
              Cancellations within 48 hours of the booking forfeit the deposit.
            </li>
            <li>
              No-shows result in full forfeiture of the deposit paid.
            </li>
            <li>
              Late arrivals exceeding 30 minutes result in automatic cancellation
              with deposit forfeiture.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            3. Travel Surcharge
          </h2>
          <p>
            Out-of-Klang Valley travel incurs a RM50 surcharge, billed
            transparently at checkout.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            4. Late Arrival
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>A RM50 late fee applies after 15 minutes past the scheduled time.</li>
            <li>
              Arrivals more than 30 minutes late result in cancellation and
              deposit forfeiture.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            5. Payment Methods
          </h2>
          <p>
            We accept FPX bank transfers and DuitNow QR via Billplz. All
            payments are processed securely and charges appear in MYR.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            6. Contact
          </h2>
          <p>For questions, contact us at hello@leish.my</p>
        </section>
      </div>
    </main>
  );
}