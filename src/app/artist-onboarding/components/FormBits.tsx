"use client";

import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";

export function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      {children}
      {hint && !error && (
        <span className="block mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</span>
      )}
      {error && (
        <span className="block mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</span>
      )}
    </label>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
    >
      {message}
    </div>
  );
}

export function NavButtons({
  isPending,
  savingDraft,
  onSaveDraft,
  prevHref,
  nextLabel,
  isLast,
}: {
  isPending: boolean;
  savingDraft: boolean;
  onSaveDraft: () => void;
  prevHref: string | null;
  nextLabel: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800">
      {prevHref ? (
        <a
          href={prevHref}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </a>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isPending || savingDraft}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-50"
        >
          {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save draft
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200/50 hover:opacity-95 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {isLast ? "Submit" : nextLabel}
        </button>
      </div>
    </div>
  );
}
