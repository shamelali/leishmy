"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, CheckCircle } from "lucide-react";
import { authClient } from "@/lib/auth/client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    setSubmitting(true);

    try {
      const { error: resetError } = (await authClient.resetPassword({
        newPassword: password,
        token,
      }) as unknown) as { error?: { message?: string } };

      if (resetError) {
        setError(resetError.message || "Failed to reset password");
        setSubmitting(false);
        return;
      }

      setDone(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">
          Password Reset
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Your password has been updated successfully.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 py-3.5 px-6 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 text-sm"
        >
          Log In <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center py-6">
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">
          Invalid Link
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-rose-600 dark:text-rose-400 hover:underline"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2 text-center">
        Set New Password
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
        Enter your new password below
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              placeholder="Re-enter password"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
        >
          {submitting ? "Resetting..." : "Reset Password"} <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-xl p-8">
          <Suspense fallback={<div className="text-center py-6 text-sm text-gray-500">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
