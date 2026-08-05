import { PricingCard } from "@/components/PricingCard";
import { PricingComparison } from "@/components/PricingComparison";
import { PricingFAQ } from "@/components/PricingFAQ";
import { ArrowRight, Sparkles, Star, Shield } from "lucide-react";
import Link from "next/link";

const tiers = [
  {
    name: "Free",
    slug: "free",
    price: 0,
    description: "Get started with your artist or studio profile on Leish!",
    features: [
      "Basic profile listing",
      "Standard booking queue",
      "Up to 5 services listed",
      "Basic profile analytics",
      "Customer inquiries via chat",
      "Leish commission: 12%",
    ],
    cta: "Get Started Free",
    popular: false,
    icon: Star,
    color: "text-gray-500",
    bgColor: "bg-gray-50 dark:bg-neutral-900",
    gradientFrom: "from-gray-100",
    gradientTo: "to-gray-200",
  },
  {
    name: "Pro",
    slug: "pro",
    price: 99,
    description: "Grow your business with enhanced visibility and lower commissions.",
    features: [
      "Everything in Free",
      "Priority booking queue",
      "Unlimited services & packages",
      "Advanced analytics & insights",
      "Featured profile placement",
      "Leish commission: 8%",
      "Promote services to targeted audiences",
      "Dedicated support chat",
    ],
    cta: "Start Pro Plan",
    popular: true,
    icon: Sparkles,
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    gradientFrom: "from-amber-400",
    gradientTo: "to-rose-500",
  },
  {
    name: "Business",
    slug: "business",
    price: 299,
    description: "For studios and established businesses that need full platform power.",
    features: [
      "Everything in Pro",
      "Dedicated account manager",
      "Custom pricing & packages",
      "API access for integrations",
      "Multi-studio management",
      "Leish commission: 5%",
      "Advanced staff management",
      "Inventory tracking",
      "Priority onboarding & training",
      "Custom branding options",
    ],
    cta: "Contact Sales",
    popular: false,
    icon: Shield,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    gradientFrom: "from-blue-400",
    gradientTo: "to-purple-500",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-rose-50/30 to-white dark:from-neutral-950 dark:via-rose-950/10 dark:to-neutral-950 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-rose-100 dark:from-amber-900/30 dark:to-rose-900/30 border border-amber-200/60 dark:border-amber-700/60 mb-6">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Pricing Plans
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
              Choose the right plan for{" "}
              <span className="bg-gradient-to-r from-amber-500 to-rose-600 bg-clip-text text-transparent">
                your business
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Whether you&apos;re just starting out or running a full-service studio,
              Leish! has a plan that fits your needs. All plans include secure
              payment processing via Billplz.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <PricingCard key={tier.slug} tier={tier} />
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            All plans include secure payment processing, customer support, and
            access to the Leish! marketplace.
          </p>
        </div>
      </section>

      <section className="py-24 bg-gray-50/50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-4">
              Compare Plans
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              See which features are included in each plan and find the perfect
              fit for your business.
            </p>
          </div>
          <PricingComparison />
        </div>
      </section>

      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              Getting started with Leish! is quick and easy.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-16 max-w-4xl mx-auto">
            {[
              {
                num: "01",
                title: "Sign Up",
                description:
                  "Create your artist or studio profile in minutes. Add your services, pricing, and portfolio.",
                color: "#e11d48",
                bgColor: "bg-rose-50 dark:bg-rose-950/30",
              },
              {
                num: "02",
                title: "Choose a Plan",
                description:
                  "Pick the plan that fits your business. Upgrade or downgrade anytime with no lock-in contracts.",
                color: "#db2777",
                bgColor: "bg-pink-50 dark:bg-pink-950/30",
              },
              {
                num: "03",
                title: "Start Booking",
                description:
                  "Customers find you on Leish! and book directly. Get paid securely through Billplz with automatic commission.",
                color: "#8b5cf6",
                bgColor: "bg-purple-50 dark:bg-purple-950/30",
              },
            ].map((step, i) => (
              <div key={i} className="relative text-center group">
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-rose-200 to-pink-200 dark:from-rose-800 dark:to-pink-800" />
                )}
                <div className="relative z-10">
                  <div
                    className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${step.bgColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <span
                      className="text-2xl font-black"
                      style={{ color: step.color }}
                    >
                      {step.num}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50/50 dark:bg-neutral-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>
          <PricingFAQ />
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white mb-6 leading-tight">
            Ready to grow your beauty business?
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of artists and studios already thriving on Leish!.
            Choose a plan and start booking today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-rose-600 font-bold rounded-2xl hover:bg-rose-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-100 text-base"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-all border border-white/20 text-base"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}