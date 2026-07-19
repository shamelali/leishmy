"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserCheck, Palette, Store, User, Mail, Phone, MapPin, Lock, ArrowRight, Check } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { malaysiaStates, malaysiaDistricts } from "@/data/malaysia-locations";

export default function RegisterPage() {
  const [role, setRole] = useState<"customer" | "artist" | "studio">("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("Selangor");
  const [district, setDistrict] = useState("");
  const [password, setPassword] = useState("");
  const [specialties, setSpecialties] = useState<string[]>(["Bridal Makeup", "Soft Glam"]);
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      setError("You must agree to the Terms of Service.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const { data, error: signUpError } = (await authClient.signUp.email({
        email,
        password,
        name,
      }) as unknown) as { data?: { user: { id: string } }; error?: { message?: string } };

      if (signUpError) {
        setError(signUpError.message || "Registration failed");
        setSubmitting(false);
        return;
      }

      if (data?.user) {
        const fullLocation = district ? `${district}, ${state}` : state;
        await fetch("/api/user/create-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.user.id,
            name,
            email,
            role,
            phone,
            location: fullLocation,
            specialties: role === "artist" ? specialties : [],
          }),
        });
      }

      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err?.message || "Registration failed");
      setSubmitting(false);
    }
  };

  const toggleSpecialty = (item: string) => {
    if (specialties.includes(item)) {
      setSpecialties(specialties.filter((s) => s !== item));
    } else {
      setSpecialties([...specialties, item]);
    }
  };

  const availableSpecialties = [
    "Bridal Makeup",
    "Soft Glam",
    "Editorial / Photoshoot",
    "Hijab Styling",
    "Airbrush Makeup",
    "SFX / Creative",
    "Hairstyling",
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <Image src="/leishlogo.png" alt="Leish!" width={48} height={48} className="h-12 w-auto group-hover:scale-105 transition-transform" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white">
            Create Your Account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Join Leish! and discover Malaysia&apos;s finest beauty professionals
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-2 border border-gray-200 dark:border-neutral-800 shadow-sm grid grid-cols-3 gap-2 mb-8">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-xl transition-all ${
              role === "customer"
                ? "bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-rose-900/40"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
            }`}
          >
            <UserCheck className="w-5 h-5 mb-1" />
            <span className="text-xs font-bold">Client / Customer</span>
            <span className={`text-[10px] ${role === "customer" ? "text-rose-100" : "text-gray-400"}`}>
              Book beauty services
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRole("artist")}
            className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-xl transition-all ${
              role === "artist"
                ? "bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-rose-900/40"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
            }`}
          >
            <Palette className="w-5 h-5 mb-1" />
            <span className="text-xs font-bold">Makeup Artist</span>
            <span className={`text-[10px] ${role === "artist" ? "text-rose-100" : "text-gray-400"}`}>
              Offer your talent
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRole("studio")}
            className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-xl transition-all ${
              role === "studio"
                ? "bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-rose-900/40"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
            }`}
          >
            <Store className="w-5 h-5 mb-1" />
            <span className="text-xs font-bold">Beauty Studio</span>
            <span className={`text-[10px] ${role === "studio" ? "text-rose-100" : "text-gray-400"}`}>
              List a salon team
            </span>
          </button>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-xl p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {role === "studio" ? "Studio Name" : "Full Name"}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={role === "studio" ? "Glamour Beauty Lounge" : "Siti Nurhaliza"}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

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
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+60 12-345 6789"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4 inline-block mr-1" /> Location
                </label>
                <select
                  value={state}
                  onChange={(e) => { setState(e.target.value); setDistrict(""); }}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none appearance-none"
                >
                  <option value="">Select State</option>
                  {malaysiaStates.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {state && malaysiaDistricts[state] && (
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none appearance-none"
                  >
                    <option value="">Select District / Area</option>
                    {malaysiaDistricts[state].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}
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
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* If signing up as Artist, let them pick specialties */}
            {role === "artist" && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Your Specialties
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSpecialties.map((item) => {
                    const selected = specialties.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleSpecialty(item)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          selected
                            ? "bg-rose-500 text-white shadow-sm"
                            : "bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-700"
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5" />} {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Terms checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-gray-300 dark:border-neutral-700"
              />
              <label htmlFor="terms" className="text-xs text-gray-600 dark:text-gray-400">
                I agree to the{" "}
                <Link href="/terms-of-service" className="text-rose-600 dark:text-rose-400 hover:underline">Terms of Service</Link> and{" "}
                <Link href="/privacy-policy" className="text-rose-600 dark:text-rose-400 hover:underline">Privacy Policy</Link>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? "Creating account..." : "Create Account"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white dark:bg-neutral-900 text-gray-400">or continue with</span>
            </div>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => authClient.signIn.social({ provider: "google", callbackURL: window.location.origin + "/onboarding" })}
            className="w-full py-3 flex items-center justify-center gap-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all text-sm"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-rose-600 dark:text-rose-400 hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
