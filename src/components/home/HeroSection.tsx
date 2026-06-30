import Link from "next/link";
import { ArrowRight, Sparkles, Star, Users, Clock } from "lucide-react";
import { stats } from "@/lib/data";

const statIcons = [Sparkles, Star, Users, Clock];

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-white dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-200/30 dark:bg-rose-900/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-200/30 dark:bg-pink-900/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Content */}
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-full mb-6 border border-rose-200/50 dark:border-rose-800/50">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Book Beauty. Anywhere.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-900 dark:text-white leading-tight">
            Your Beauty,{" "}
            <span className="gradient-text">Perfected.</span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">
            Discover makeup artists and studios, view real-time availability,
            and secure your booking in minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              href="/artists"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-2xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-xl shadow-rose-200/50 dark:shadow-rose-900/30 hover:scale-105 active:scale-100 text-base"
            >
              Browse Artists <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/studios"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white font-bold rounded-2xl border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-lg text-base"
            >
              Explore Studios
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mt-12 pt-8 border-t border-gray-100 dark:border-neutral-800">
            {stats.map((stat, i) => {
              const Icon = statIcons[i];
              return (
                <div key={i} className="text-center animate-fade-in-up" style={{ animationDelay: `${200 + i * 100}ms` }}>
                  <Icon className="w-5 h-5 mx-auto mb-1.5 text-rose-500 dark:text-rose-400" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right - Image Grid */}
        <div className="relative hidden lg:block">
          <div className="grid grid-cols-2 gap-4 animate-fade-in delay-300">
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-rose-200/40 dark:shadow-rose-900/20 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="aspect-[3/4] relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=800&fit=crop"
                    alt="Soft glam makeup"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl shadow-rose-200/40 dark:shadow-rose-900/20 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="aspect-square group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop"
                    alt="Contemporary beauty"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="rounded-2xl overflow-hidden shadow-xl shadow-rose-200/40 dark:shadow-rose-900/20 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="aspect-square group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/hero-warm-tones.png"
                    alt="Warm tones"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-rose-200/40 dark:shadow-rose-900/20 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="aspect-[3/4] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=800&fit=crop"
                    alt="Beautiful look"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Floating card - Top Rated */}
          <div className="absolute -bottom-4 -left-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl shadow-rose-100/50 dark:shadow-rose-900/20 p-4 flex items-center gap-3 animate-float border border-rose-100/50 dark:border-neutral-700">
            <div className="w-11 h-11 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Top Rated</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">4.9 avg from 500+ reviews</p>
            </div>
          </div>

          {/* Floating card - Artists */}
          <div className="absolute -top-2 -right-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl shadow-rose-100/50 dark:shadow-rose-900/20 p-3 animate-float border border-rose-100/50 dark:border-neutral-700" style={{ animationDelay: "1s" }}>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-rose-300 dark:bg-rose-600 border-2 border-white dark:border-neutral-800" />
                <div className="w-7 h-7 rounded-full bg-pink-300 dark:bg-pink-600 border-2 border-white dark:border-neutral-800" />
                <div className="w-7 h-7 rounded-full bg-rose-400 dark:bg-rose-500 border-2 border-white dark:border-neutral-800" />
              </div>
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">+50 artists</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
