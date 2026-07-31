"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, Loader2 } from "lucide-react";

interface AutoSaveFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  type?: "text" | "email" | "tel" | "number" | "textarea";
  placeholder?: string;
  rows?: number;
  min?: number;
  max?: number;
  required?: boolean;
  className?: string;
}

export default function AutoSaveField({
  label,
  value: initialValue,
  onSave,
  type = "text",
  placeholder,
  rows,
  min,
  max,
  required,
  className = "",
}: AutoSaveFieldProps) {
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const debouncedSave = useCallback(
    (newValue: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (newValue === initialValue) return;

      timeoutRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;
        setStatus("saving");
        try {
          await onSave(newValue);
          if (mountedRef.current) setStatus("saved");
        } catch {
          if (mountedRef.current) setStatus("idle");
        }
        setTimeout(() => {
          if (mountedRef.current) setStatus("idle");
        }, 2000);
      }, 500);
    },
    [initialValue, onSave],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleChange(newValue: string) {
    setValue(newValue);
    debouncedSave(newValue);
  }

  const baseClasses =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-colors";

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
        <div className="flex items-center gap-1.5 h-5">
          {status === "saving" && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving
            </span>
          )}
          {status === "saved" && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
        </div>
      </div>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={rows || 3}
          className={`${baseClasses} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          className={baseClasses}
        />
      )}
    </div>
  );
}
