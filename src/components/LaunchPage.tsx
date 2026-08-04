"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Users, Clock, CheckCircle2 } from "lucide-react";
import { WaitlistForm } from "@/components/WaitlistForm";

const statIcons = [Sparkles, undefined, Users, Clock];

export function LaunchPage({ waitlistCount }: { waitlistCount?: number }) {
  const displayCount = waitlistCount ?? 0;

  return (
    <>
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-white dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-200/30 dark:bg-rose-900/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-200/30 dark:bg-pink-900/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "0.5s" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100/80 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-full mb-6 border border-rose-200/50 dark:border-rose-800/50 animate-slide-in-left">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Book Beauty. Anywhere.</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-gray-900 dark:text-white leading-tight animate-slide-in-left delay-200">
              <span className="gradient-text animate-shimmer-text">Your Style, Booked.</span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl animate-slide-in-left delay-300">
              Malaysia&apos;s beauty booking platform is almost here. Join the waitlist and be the first to discover, book, and glow.
            </p>

            <WaitlistForm />

            <div className="flex items-center gap-2 mt-6 text-sm text-gray-500 dark:text-gray-400 animate-slide-in-left delay-500">
              <CheckCircle2 className="w-4 h-4 text-rose-500" />
              <span>Free to join &middot; No commitment &middot; RM10 off first booking</span>
            </div>

            {displayCount > 0 && (
              <div className="grid grid-cols-1 gap-4 mt-10 pt-8 border-t border-gray-100 dark:border-neutral-800 animate-fade-in-up">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{displayCount}+</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Early Adopters</p>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
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
              <div className="space-y-4 lg:pt-8">
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

      <section className="py-24 bg-gradient-to-b from-white to-rose-50/30 dark:from-neutral-950 dark:to-neutral-900" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-rose-500 uppercase tracking-wider mb-2">The Process</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white">How It Works</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto">Get your perfect look in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-16">
            {[
              { num: "01", Icon: Sparkles, title: "Browse Artists", description: "Explore Malaysia&apos;s top makeup artists and studios. Filter by style, location, or budget.", color: "#e11d48", bgColor: "bg-rose-50 dark:bg-rose-950/30" },
              { num: "02", Icon: Clock, title: "Book Instantly", description: "Select your date and time, choose your services, and secure your booking with instant confirmation.", color: "#db2777", bgColor: "bg-pink-50 dark:bg-pink-950/30" },
              { num: "03", Icon: CheckCircle2, title: "Get Glam", description: "Relax and let our expert artists work their magic. You&apos;ll leave looking and feeling amazing.", color: "#8b5cf6", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
            ].map((step, i) => (
              <div key={i} className="relative text-center group">
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-rose-200 to-pink-200 dark:from-rose-800 dark:to-pink-800" />
                )}
                <div className="relative z-10">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${step.bgColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <step.Icon className="w-8 h-8" style={{ color: step.color }} />
                  </div>
                  <span className="text-xs font-bold text-rose-400 dark:text-rose-500 tracking-widest mb-2 block">STEP {step.num}</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-4">Ready to Glow?</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-4 max-w-xl mx-auto mb-8">Join the waitlist now and get RM10 off your first booking when Leish! launches.</p>
          <WaitlistForm />
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/artists" className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-2xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-xl shadow-rose-200/50 dark:shadow-rose-900/30 hover:scale-105 active:scale-100 text-base">
              Explore Artists <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/studios" className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white font-bold rounded-2xl border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-lg text-base">
              Explore Studios
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}