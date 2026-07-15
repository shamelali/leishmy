import Link from "next/link";
import { ArrowRight, Sparkles, Users, Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";

const statIcons = [Sparkles, undefined, Users, Clock];

export async function HeroSection({ stats }: { stats?: { value: string; label: string }[] }) {
  const t = await getTranslations("hero");
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-white dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-200/30 dark:bg-rose-900/10 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-200/30 dark:bg-pink-900/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "0.5s" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Content */}
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-full mb-6 border border-rose-200/50 dark:border-rose-800/50 animate-slide-in-left">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("tagline")}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-900 dark:text-white leading-tight animate-slide-in-left delay-200">
            <span className="gradient-text animate-shimmer-text">{t("heading")}</span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl animate-slide-in-left delay-300">
            {t("subheading")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-slide-in-left delay-400">
            <Link
              href="/artists"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-2xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-xl shadow-rose-200/50 dark:shadow-rose-900/30 hover:scale-105 active:scale-100 text-base"
            >
              {t("findBookArtists")} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/studios"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white font-bold rounded-2xl border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-lg text-base"
            >
              {t("exploreStudios")}
            </Link>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-6 mt-12 pt-8 border-t border-gray-100 dark:border-neutral-800">
              {stats.map((stat, i) => {
                const Icon = statIcons[i];
                return (
                  <div key={i} className="text-center animate-fade-in-up" style={{ animationDelay: `${200 + i * 100}ms` }}>
                    {Icon && <Icon className="w-5 h-5 mx-auto mb-1.5 text-rose-500 dark:text-rose-400" />}
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right - Image Grid */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-rose-200/40 dark:shadow-rose-900/20 transform rotate-1 hover:rotate-0 transition-transform duration-500 animate-scale-in">
                <div className="aspect-[3/4] relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/artfulcolorworks-ai-generated-9159114.jpg"
                    alt={t("imgSoftGlam")}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl shadow-rose-200/40 dark:shadow-rose-900/20 transform -rotate-2 hover:rotate-0 transition-transform duration-500 animate-scale-in delay-100">
                <div className="aspect-square group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/gromovataya-woman-3096664.jpg"
                    alt={t("imgContemporary")}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4 lg:pt-8">
              <div className="rounded-2xl overflow-hidden shadow-xl shadow-rose-200/40 dark:shadow-rose-900/20 transform -rotate-1 hover:rotate-0 transition-transform duration-500 animate-scale-in delay-200">
                <div className="aspect-square group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/omarmedinafilms-wedding-1183271_1920.jpg"
                    alt={t("imgWarmTones")}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-rose-200/40 dark:shadow-rose-900/20 transform rotate-2 hover:rotate-0 transition-transform duration-500 animate-scale-in delay-300">
                <div className="aspect-[3/4] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/u_p081rxaf-wedding-9473397.jpg"
                    alt={t("imgBeautiful")}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
