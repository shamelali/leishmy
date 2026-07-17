"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

const locales = [
  { code: "en", label: "English" },
  { code: "ms-MY", label: "Bahasa Melayu" },
  { code: "zh-MY", label: "中文" },
  { code: "ta-MY", label: "தமிழ்" },
] as const;

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (locale: (typeof locales)[number]["code"]) => {
    setOpen(false);
    router.replace(pathname, { locale });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Switch language"
      >
        <Languages className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => switchLocale(loc.code)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                currentLocale === loc.code
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 font-semibold"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {loc.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
