"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, Type, Contrast, RotateCcw, X } from "lucide-react";

type FontSize = "normal" | "large" | "xlarge";

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>("normal");
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem("leish-a11y") || "{}");
      /* eslint-disable react-hooks/set-state-in-effect */
      if (prefs.fontSize) setFontSize(prefs.fontSize);
      if (prefs.highContrast) setHighContrast(prefs.highContrast);
      if (prefs.reducedMotion) setReducedMotion(prefs.reducedMotion);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {}
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(
      "text-size-large",
      "text-size-xlarge",
      "high-contrast",
      "reduced-motion",
    );

    if (fontSize === "large") root.classList.add("text-size-large");
    if (fontSize === "xlarge") root.classList.add("text-size-xlarge");
    if (highContrast) root.classList.add("high-contrast");
    if (reducedMotion) root.classList.add("reduced-motion");

    try {
      localStorage.setItem(
        "leish-a11y",
        JSON.stringify({ fontSize, highContrast, reducedMotion }),
      );
    } catch {}
  }, [fontSize, highContrast, reducedMotion]);

  const reset = () => {
    setFontSize("normal");
    setHighContrast(false);
    setReducedMotion(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-20 z-40 w-11 h-11 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-700 shadow-lg transition-all hover:scale-110"
        aria-label="Accessibility options"
      >
        <Eye className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed bottom-20 right-16 w-72 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 z-50 animate-scale-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-rose-500" /> Accessibility
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" /> Text Size
              </label>
              <div className="flex gap-1.5">
                {([
                  { value: "normal" as FontSize, label: "A", size: "text-xs" },
                  { value: "large" as FontSize, label: "A", size: "text-sm" },
                  {
                    value: "xlarge" as FontSize,
                    label: "A",
                    size: "text-base",
                  },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFontSize(opt.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${fontSize === opt.value ? "bg-rose-500 text-white shadow-md" : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"}`}
                  >
                    <span className={opt.size}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${highContrast ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800" : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300"}`}
            >
              <span className="flex items-center gap-2">
                <Contrast className="w-4 h-4" /> High Contrast
              </span>
              <span
                className={`w-8 h-4 rounded-full relative transition-colors ${highContrast ? "bg-rose-500" : "bg-gray-300 dark:bg-neutral-600"}`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${highContrast ? "left-4" : "left-0.5"}`}
                />
              </span>
            </button>

            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${reducedMotion ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800" : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300"}`}
            >
              <span className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Reduce Motion
              </span>
              <span
                className={`w-8 h-4 rounded-full relative transition-colors ${reducedMotion ? "bg-rose-500" : "bg-gray-300 dark:bg-neutral-600"}`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${reducedMotion ? "left-4" : "left-0.5"}`}
                />
              </span>
            </button>

            <button
              onClick={reset}
              className="w-full py-2 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
