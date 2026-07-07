"use client";

import { useState } from "react";
import { Languages } from "lucide-react";

const locales = [
  { code: "en", label: "English" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "zh", label: "中文" },
  { code: "ta", label: "தமிழ்" },
];

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);

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
              onClick={() => setOpen(false)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {loc.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
