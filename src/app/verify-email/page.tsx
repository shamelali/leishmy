"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle, RefreshCw } from "lucide-react";
import { authClient } from "@/lib/auth/client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const chars = value.split("").slice(0, 6);
      const newOtp = [...otp];
      chars.forEach((c, i) => {
        if (index + i < 6) newOtp[index + i] = c;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const { error: verifyError } = await authClient.emailOtp.checkVerificationOtp({
        email,
        otp: code,
        type: "email-verification",
      });

      if (verifyError) {
        setError(verifyError.message || "Invalid or expired code");
        setSubmitting(false);
        return;
      }

      setVerified(true);
    } catch (err: any) {
      setError(err?.message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResent(false);

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
      setResent(true);
    } catch {
      setError("Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">
          Email Verified!
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Your email has been verified. You can now sign in.
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

  if (!email) {
    return (
      <div className="text-center py-6">
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">
          Missing Email
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          No email address provided for verification.
        </p>
        <Link
          href="/register"
          className="text-sm font-medium text-rose-600 dark:text-rose-400 hover:underline"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-6">
        <Mail className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">
          Verify Your Email
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter the 6-digit code sent to <strong>{email}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-lg font-bold rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
            />
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || otp.join("").length !== 6}
          className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
        >
          {submitting ? "Verifying..." : "Verify Email"} <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-sm text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
          {resending ? "Sending..." : resent ? "Code resent!" : "Resend code"}
        </button>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-xl p-8">
          <VerifyEmailContent />
        </div>
      </div>
    </div>
  );
}
