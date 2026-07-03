"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCheck, Heart, Palette, Store, Lock, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await login(email, password);
    if (res.success) {
      router.push("/");
    } else {
      setError(res.error || "Login failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Leish!</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Sign in to manage your appointments, favorites, and profile.
          </p>
        </div>

        {/* Quick Role Cards */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-rose-100 dark:border-rose-900/30 shadow-sm mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-500 mb-3">
            New here? Choose your path
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/register"
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-all text-center group"
            >
              <UserCheck className="w-5 h-5 text-rose-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Client</span>
              <span className="text-[10px] text-gray-400">Customer</span>
            </Link>

            <Link
              href="/register"
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-all text-center group"
            >
              <Palette className="w-5 h-5 text-pink-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Artist</span>
              <span className="text-[10px] text-gray-400">Pro MUA</span>
            </Link>

            <Link
              href="/register"
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-all text-center group"
            >
              <Store className="w-5 h-5 text-purple-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Studio</span>
              <span className="text-[10px] text-gray-400">Salon</span>
            </Link>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.my"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="text-right">
              <Link href="/forgot-password" className="text-xs text-rose-600 dark:text-rose-400 hover:underline">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {submitting ? "Signing in..." : "Log In"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-rose-600 dark:text-rose-400 hover:underline">
              Sign Up Free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
