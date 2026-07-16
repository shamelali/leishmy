import Link from "next/link";
import { Palette, Users, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function FeaturedArtistsSection({ onboardingArtists, categoryCount }: { onboardingArtists: number; categoryCount: number }) {
  const t = await getTranslations("featuredArtists");

  return (
    <section className="py-24 bg-gradient-to-b from-white to-rose-50/30 dark:from-neutral-950 dark:to-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-rose-500 uppercase tracking-wider mb-2">
            {t('label')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white">
            {t('heading')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto">
            {t('description')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-rose-100 dark:border-rose-900/30 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('card1Title')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('card1Desc')}
            </p>
            <Link
              href="/community/apply"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
            >
              {t('card1Cta')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 border border-gray-100 dark:border-neutral-800 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white dark:text-gray-900" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('card2Title')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('card2Desc')}
            </p>
            <Link
              href="/artists"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {t('card2Cta')} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{onboardingArtists}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('statOnboarding')}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{categoryCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('statCategories')}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">KL & Selangor</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('statArea')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
