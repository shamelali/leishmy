import { CommunityApplicationForm } from "@/components/CommunityApplicationForm";
import { Users, Palette, Calendar, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: t("communityApplyTitle"),
    description: t("communityApplyDescription"),
  };
}

export default async function CommunityApplyPage() {
  const t = await getTranslations("community");

  const perks = [
    { icon: Users, title: t('perk1Title'), description: t('perk1Desc') },
    { icon: Palette, title: t('perk2Title'), description: t('perk2Desc') },
    { icon: Calendar, title: t('perk3Title'), description: t('perk3Desc') },
    { icon: Star, title: t('perk4Title'), description: t('perk4Desc') },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <section className="bg-gradient-to-br from-rose-50 via-pink-50 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white">
            {t('heading')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
            {t('subtitle')}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {t('whyJoin')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                {t('description')}
              </p>

              <div className="space-y-5">
                {perks.map((perk) => {
                  const Icon = perk.icon;
                  return (
                    <div key={perk.title} className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {perk.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {perk.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 p-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  {t('areaNotice')}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-700 shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {t('applicationForm')}
              </h3>
              <CommunityApplicationForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
