"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserCheck, Palette, Store, Heart, Mail, Phone, MapPin, Check, ArrowRight, Loader2 } from "lucide-react";
import { authClient, useSession } from "@/lib/auth/client";
import { useAuth } from "@/context/AuthContext";
import { malaysiaStates, malaysiaDistricts } from "@/data/malaysia-locations";

const specialtiesList = [
  "Bridal Makeup",
  "Soft Glam",
  "Editorial / Photoshoot",
  "Hijab Styling",
  "Airbrush Makeup",
  "SFX / Creative",
  "Hairstyling",
];

export default function OnboardingPage() {
  const { data: session, isPending } = useSession();
  const { refreshProfile } = useAuth();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<"customer" | "artist" | "studio">("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("Selangor");
  const [district, setDistrict] = useState("");
  const [specialties, setSpecialties] = useState<string[]>(["Bridal Makeup", "Soft Glam"]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace("/login");
      return;
    }

    (async () => {
      setName(session.user.name || "");
      setChecking(true);

      try {
        const res = await fetch(`/api/user?userId=${session.user.id}`);
        const data = await res.json();
        if (data?.user?.role && (data.user.phone || data.user.location)) {
          router.replace("/");
        } else {
          if (data?.user?.phone) setPhone(data.user.phone);
          if (data?.user?.location && data.user.location !== "Cyberjaya, Malaysia") {
            const parts = data.user.location.split(", ");
            if (parts.length === 2) {
              setState(parts[1]);
              setDistrict(parts[0]);
            }
          }
          if (data?.user?.name) setName(data.user.name);
          setChecking(false);
        }
      } catch (err) {
        console.warn("[Onboarding] profile check failed:", err);
        setChecking(false);
      }
    })();
  }, [session, isPending, router]);

  const toggleSpecialty = (item: string) => {
    setSpecialties((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setSubmitting(true);
    setError("");

    try {
      const fullLocation = district ? `${district}, ${state}` : state;

      const res = await fetch("/api/user/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          name,
          email: session.user.email,
          role,
          phone,
          location: fullLocation,
          specialties: role === "artist" ? specialties : [],
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to save profile");
        setSubmitting(false);
        return;
      }

      const target = role === "artist" ? "/dashboard/artist" : role === "studio" ? "/dashboard/studio" : "/";
      await refreshProfile();
      router.push(target);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (isPending || checking) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Leish!</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white">
            Complete Your Profile
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Just a few more details to get started
          </p>
        </div>

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

        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-200 dark:border-neutral-800 shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {role === "studio" ? "Studio Name" : "Full Name"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={role === "studio" ? "Glamour Beauty Lounge" : "Your name"}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={session?.user?.email || ""}
                  readOnly
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed outline-none"
                />
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

            {role === "artist" && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Your Specialties
                </label>
                <div className="flex flex-wrap gap-2">
                  {specialtiesList.map((item) => {
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
              {submitting ? "Saving..." : "Complete Setup"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
