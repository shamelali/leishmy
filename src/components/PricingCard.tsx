import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface PricingTier {
  name: string;
  slug: string;
  price: number;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  gradientFrom: string;
  gradientTo: string;
}

interface PricingCardProps {
  tier: PricingTier;
}

export function PricingCard({ tier }: PricingCardProps) {
  const Icon = tier.icon;
  const pricePerMonth = tier.price;
  const pricePerDay = tier.price > 0 ? (tier.price / 30).toFixed(1) : "0";

  return (
    <div className="relative group">
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-rose-600 text-white text-xs font-bold rounded-full z-10">
          Most Popular
        </div>
      )}
      <div className="relative bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 p-8 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl ${tier.bgColor} flex items-center justify-center`}
            >
              <Icon className={`w-6 h-6 ${tier.color}`} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {tier.name}
            </h3>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {tier.description}
        </p>

        <div className="mb-8">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-gray-900 dark:text-white">
              RM{pricePerMonth}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              /month
            </span>
          </div>
          {tier.price > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Less than RM{pricePerDay}/day
            </p>
          )}
        </div>

        <ul className="space-y-3 mb-8 flex-1">
          {tier.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300"
            >
              <svg
                className="w-4 h-4 text-rose-500 shrink-0 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        <Link
          href={tier.price === 0 ? "/register" : "/leish-plus"}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-2xl transition-all text-sm ${
            tier.popular
              ? "bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 hover:from-amber-600 hover:to-rose-700 hover:scale-[1.02] active:scale-100"
              : "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-700"
          }`}
        >
          {tier.cta}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}