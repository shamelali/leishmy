"use client";

import Link from "next/link";
import { Home, Heart } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-white dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-rose-200/50 dark:shadow-rose-900/30">
          <Heart className="w-10 h-10 text-white fill-white" />
        </div>
        <h1 className="text-6xl font-bold gradient-text mb-4">{t("title")}</h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t("heading")}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {t("description")}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg"
        >
          <Home className="w-4 h-4" /> {t("goHome")}
        </Link>
      </div>
    </div>
  );
}
