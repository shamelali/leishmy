"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { submitProfile, type ActionResult } from "../actions";
import { FormError } from "./FormBits";

interface StepReviewProps {
  summary: {
    name: string | null;
    email: string | null;
    location: string | null;
    bio: string | null;
    experience: number | null;
    portfolioCount: number;
    serviceCount: number;
  };
  prevHref: string;
  status: string;
}

export function StepReview({ summary, prevHref, status }: StepReviewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptVerification, setAcceptVerification] = useState(false);
  const [submitted, setSubmitted] = useState(status === "pending_verification" || status === "verified");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await submitProfile({ acceptTerms, acceptVerification });
      if (res.ok) {
        setSubmitted(true);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
          Profile submitted
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Thank you! We will review your profile and get back to you soon.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href="/dashboard/artist"
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200/50"
          >
            Go to dashboard
          </a>
          <Link
            href="/"
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-200"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Review &amp; submit</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Check everything looks right before submitting.</p>
      </div>

      <FormError message={error} />

      <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 divide-y divide-gray-100 dark:divide-neutral-800">
        <Row label="Name" value={summary.name ?? "—"} />
        <Row label="Email" value={summary.email ?? "—"} />
        <Row label="Location" value={summary.location ?? "—"} />
        <Row
          label="Experience"
          value={summary.experience != null ? `${summary.experience} years` : "—"}
        />
        <Row
          label="Bio"
          value={summary.bio ? truncate(summary.bio, 200) : "—"}
        />
        <Row
          label="Portfolio"
          value={`${summary.portfolioCount} images`}
        />
        <Row
          label="Services"
          value={`${summary.serviceCount} items`}
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="form-checkbox mt-1"
            required
          />
          <span className="text-sm text-gray-700 dark:text-gray-200">
            I confirm that the information provided is accurate and I agree to the terms of service.
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptVerification}
            onChange={(e) => setAcceptVerification(e.target.checked)}
            className="form-checkbox mt-1"
            required
          />
          <span className="text-sm text-gray-700 dark:text-gray-200">
            I understand that Leish! may verify my identity and professional credentials.
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800">
        <a
          href={prevHref}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </a>
        <button
          type="submit"
          disabled={isPending || !acceptTerms || !acceptVerification}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-200/50 hover:opacity-95 disabled:opacity-60"
        >
          Submit profile
        </button>
      </div>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 px-4 py-3 text-sm">
      <div className="text-gray-500 dark:text-gray-400">{label}</div>
      <div className="sm:col-span-2 text-gray-900 dark:text-gray-100 break-words">{value}</div>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
