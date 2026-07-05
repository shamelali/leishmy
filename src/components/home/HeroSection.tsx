import Link from "next/link";
import { ArrowRight, Sparkles, Users, Clock } from "lucide-react";

const statIcons = [Sparkles, undefined, Users, Clock];

export function HeroSection({ stats }: { stats?: { value: string; label: string }[] }) {
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
            <span>Book Beauty. Anywhere.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-900 dark:text-white leading-tight animate-slide-in-left delay-200">
            Your Beauty,{" "}
            <span className="gradient-text animate-shimmer-text">Perfected.</span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl animate-slide-in-left delay-300">
            Discover makeup artists and studios, view real-time availability,
            and secure your booking in minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-slide-in-left delay-400">
            <Link
              href="/artists"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-2xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-xl shadow-rose-200/50 dark:shadow-rose-900/30 hover:scale-105 active:scale-100 text-base"
            >
              Find &amp; Book Artists <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/studios"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white font-bold rounded-2xl border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-lg text-base"
            >
              Explore Studios
            </Link>
            <a
              href="https://wa.me/601137633788"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 font-semibold rounded-2xl border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/50 transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Request via WhatsApp
            </a>
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
        <div className="relative hidden lg:block">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-rose-200/40 dark:shadow-rose-900/20 transform rotate-1 hover:rotate-0 transition-transform duration-500 animate-scale-in">
                <div className="aspect-[3/4] relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/artfulcolorworks-ai-generated-9159114.jpg"
                    alt="Soft glam makeup"
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
                    alt="Contemporary beauty"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="rounded-2xl overflow-hidden shadow-xl shadow-rose-200/40 dark:shadow-rose-900/20 transform -rotate-1 hover:rotate-0 transition-transform duration-500 animate-scale-in delay-200">
                <div className="aspect-square group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/omarmedinafilms-wedding-1183271_1920.jpg"
                    alt="Warm tones"
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
                    alt="Beautiful look"
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
