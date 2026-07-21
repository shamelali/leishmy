"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Check } from "lucide-react";

const locales = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ms-MY", label: "Melayu", flag: "🇲🇾" },
  { code: "zh-MY", label: "中文", flag: "🇨🇳" },
  { code: "ta-MY", label: "தமிழ்", flag: "🇮🇳" },
];

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchLocale(code: string) {
    if (code === locale) {
      setOpen(false);
      return;
    }
    router.replace(pathname, { locale: code });
    setOpen(false);
  }

  const current = locales.find((l) => l.code === locale) || locales[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors text-sm"
        aria-label="Switch language"
      >
        {current.flag}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700 py-1 z-50">
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => switchLocale(loc.code)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                loc.code === locale
                  ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800"
              }`}
            >
              <span className="text-base">{loc.flag}</span>
              <span className="flex-1">{loc.label}</span>
              {loc.code === locale && (
                <Check className="w-3.5 h-3.5 text-rose-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
