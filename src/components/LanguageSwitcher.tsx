"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";

const locales = ["en", "ms-MY", "zh-MY", "ta-MY"] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("language");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchLocale = (code: string) => {
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-neutral-800 transition-colors"
        aria-label={t("selectLanguage")}
      >
        <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-lg py-1 z-50">
          {locales.map((code) => (
            <button
              key={code}
              onClick={() => switchLocale(code)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                locale === code
                  ? "text-rose-600 dark:text-rose-400 font-semibold bg-rose-50/50 dark:bg-rose-950/20"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800"
              }`}
            >
              {t(code)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
