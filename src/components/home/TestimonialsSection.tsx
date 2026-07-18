import { Star, Quote } from "lucide-react";

type TestimonialProps = {
  quote: string;
  author: string;
  role: string | null;
  rating: number | null;
};

export function TestimonialsSection({ testimonials }: { testimonials: TestimonialProps[] | null }) {
  if (!testimonials || testimonials.length === 0) return null;
  return (
    <section
      className="py-24 bg-gradient-to-b from-rose-50/30 to-white dark:from-neutral-900 dark:to-neutral-950"
      id="testimonials"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-rose-500 uppercase tracking-wider mb-2">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white">
            What Our Clients Say
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="relative bg-white dark:bg-neutral-900 rounded-2xl p-7 shadow-sm border border-gray-100 dark:border-neutral-800 hover:shadow-lg dark:hover:shadow-neutral-900/50 hover:border-rose-100 dark:hover:border-rose-900/50 transition-all duration-300 group"
            >
              <Quote className="w-8 h-8 text-rose-100 dark:text-rose-900/50 mb-4 fill-rose-100 dark:fill-rose-900/50 group-hover:text-rose-200 dark:group-hover:text-rose-800/50 group-hover:fill-rose-200 dark:group-hover:fill-rose-800/50 transition-colors" />

              {t.rating != null && (
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-3.5 h-3.5 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
              )}

              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-sm">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-50 dark:border-neutral-800">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {t.author}
                  </p>
                  <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
                    {t.role || ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
