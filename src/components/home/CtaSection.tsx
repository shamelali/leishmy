import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white/90 text-xs font-semibold rounded-full mb-6 backdrop-blur-sm border border-white/20">
          <Sparkles className="w-3.5 h-3.5" /> Ready to Glow?
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white mb-6 leading-tight">
          Your Perfect Look Awaits
        </h2>

        <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join hundreds of happy clients who found their ideal makeup artist
          through Leish!. Book today and experience beauty perfected.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/artists"
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-white text-rose-600 font-bold rounded-2xl hover:bg-rose-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-100 text-base"
          >
            Browse Artists <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
