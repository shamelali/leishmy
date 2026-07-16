import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

type CategoryProps = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  artistCount: number;
};

export async function CategoriesSection({ categories }: { categories: CategoryProps[] }) {
  const t = await getTranslations("categories");

  return (
    <section className="py-24 bg-white dark:bg-neutral-950" id="categories">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-sm font-semibold text-rose-500 uppercase tracking-wider mb-2">
              {t('label')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white">
              {t('heading')}
            </h2>
          </div>
          <Link
            href="/artists"
            className="hidden sm:inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium text-sm transition-colors group"
          >
            View All{" "}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/artists?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 dark:from-neutral-800 dark:to-neutral-900 hover:from-rose-900 hover:to-pink-900 dark:hover:from-rose-950 dark:hover:to-pink-950 transition-all duration-500"
            >
              {/* Background image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.image || "/placeholder.svg"}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="relative p-5 flex items-start gap-3 min-h-[130px]">
                <span className="text-2xl group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">
                  {cat.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white group-hover:text-rose-100 transition-colors mb-1 text-sm">
                    {cat.name}
                  </h3>
                  <span className="text-xs text-rose-300 dark:text-rose-400 font-medium">
                    {t('artistCount', { count: cat.artistCount })}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-rose-300 group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
              </div>
            </Link>
          ))}
        </div>

        <div className="sm:hidden mt-6 text-center">
          <Link
            href="/artists"
            className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium text-sm"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
