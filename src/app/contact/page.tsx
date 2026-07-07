import { ContactForm } from "@/components/ContactForm";
import { MapPin, Mail, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
  };
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <section className="bg-gradient-to-br from-rose-50 via-pink-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white">
            Contact Us
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Have a question? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Get in Touch
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Whether you&apos;re an artist looking to join or a client with questions,
                we&apos;re here to help. Reach out and we&apos;ll get back to you as soon as possible.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Email</p>
                    <a href="mailto:hello@leish.my" className="text-rose-600 dark:text-rose-400 hover:underline text-sm">
                      hello@leish.my
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">WhatsApp</p>
                    <a
                      href="https://wa.me/601137633788"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 dark:text-rose-400 hover:underline text-sm"
                    >
                      +60 11-3763 3788
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Location</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Kuala Lumpur, Malaysia
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-700 shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Send us a message
              </h3>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
