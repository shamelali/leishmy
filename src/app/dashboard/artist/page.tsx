"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Banknote,
  Wallet,
  Clock,
  User,
  Sparkles,
  Image,
} from "lucide-react";
import Skeleton from "@/components/Skeleton";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

interface Payout {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface Booking {
  id: string;
  artistId?: string;
  artistName?: string;
  client?: string;
  userName?: string;
  service?: string;
  date?: string;
  time?: string;
  price?: number;
  amount?: number;
  status: string;
}

export default function DashboardArtist() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [stats, setStats] = useState({
    bookings: 0,
    revenue: 0,
    rating: 0,
    reviews: 0,
  });
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsPerPage, setBookingsPerPage] = useState(5);
  const [bookingsFilter, setBookingsFilter] = useState<
    "all" | "upcoming" | "completed" | "cancelled"
  >("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });

  const [fetchError, setFetchError] = useState("");
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profile, setProfile] = useState({
    bio: "",
    experience: 0,
    languages: [] as string[],
    responseTime: "",
    price: 0,
    portfolio: [] as string[],
    location: "",
    phone: "",
  });
  const [profileForm, setProfileForm] = useState({
    bio: "",
    experience: 0,
    languages: "",
    responseTime: "",
    price: 0,
    portfolio: "",
    location: "",
    phone: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const [payoutRes, bookingsRes, profileRes] = await Promise.all([
          fetch(`/api/payments?action=payouts&userId=${user.id}`),
          fetch(`/api/user?action=bookings&userId=${user.id}`),
          fetch(`/api/user?action=artist-profile&userId=${user.id}`),
        ]);

        if (payoutRes.ok) {
          const payoutData = await payoutRes.json();
          setPayouts(payoutData.payouts || []);
          setBankAccounts(payoutData.bankAccounts || []);
          setPendingBalance(payoutData.pendingBalance || 0);
        } else {
          setFetchError("Failed to load payout data");
        }

        if (bookingsRes.ok) {
          const bookingData = await bookingsRes.json();
          const allBookings = bookingData.bookings || [];
          setBookings(allBookings);
          setStats({
            bookings: allBookings.length,
            revenue: allBookings.reduce(
              (sum: number, b: Booking) =>
                b.status === "completed" ? sum + Number(b.amount || 0) : sum,
              0,
            ),
            rating: bookingData.rating || 0,
            reviews: bookingData.reviewCount || 0,
          });
        } else {
          setFetchError("Failed to load booking data");
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const a = profileData.artist;
          if (a) {
            setProfile(a);
            setProfileForm({
              bio: a.bio || "",
              experience: a.experience || 0,
              languages: (a.languages || []).join(", "),
              responseTime: a.responseTime || "",
              price: a.price || 0,
              portfolio: (a.portfolio || []).join("\n"),
              location: a.location || "",
              phone: a.phone || "",
            });
          }
        }
      } catch {
        setFetchError("Network error — check your connection");
      }
      setLoading(false);
    };
    fetchData();
  }, [user?.id]);

  const handleRegisterBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    await fetch("/api/payments?action=register-bank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, ...bankForm }),
    });
    setShowBankForm(false);
    setBankForm({ bankName: "", accountNumber: "", accountHolder: "" });
    const res = await fetch(`/api/payments?action=payouts&userId=${user.id}`);
    if (res.ok) {
      const data = await res.json();
      setBankAccounts(data.bankAccounts || []);
    }
  };

  const statusMap: Record<string, string[]> = {
    all: ["pending", "confirmed", "completed", "cancelled"],
    upcoming: ["pending", "confirmed"],
    completed: ["completed"],
    cancelled: ["cancelled"],
  };

  const filtered = bookings.filter(
    (b: Booking) => statusMap[bookingsFilter]?.includes(b.status) ?? true,
  );
  const totalPages = Math.ceil(filtered.length / bookingsPerPage);
  const paged = filtered.slice(
    (bookingsPage - 1) * bookingsPerPage,
    bookingsPage * bookingsPerPage,
  );

  const handleConfirm = async (bookingId: string) => {
    await fetch(`/api/user?action=confirm-booking&userId=${user?.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, userId: user?.id }),
    });
    setBookings((prev: Booking[]) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "confirmed" } : b)),
    );
  };

  const handleReject = async (bookingId: string) => {
    await fetch(`/api/user?action=reject-booking&userId=${user?.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, userId: user?.id }),
    });
    setBookings((prev: Booking[]) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b)),
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setProfileSaving(true);
    setProfileMsg("");
    try {
      const res = await fetch(`/api/user?action=artist-profile&userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: profileForm.bio,
          experience: Number(profileForm.experience) || 0,
          languages: profileForm.languages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          responseTime: profileForm.responseTime,
          price: Number(profileForm.price) || 0,
          portfolio: profileForm.portfolio
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          location: profileForm.location,
          phone: profileForm.phone,
        }),
      });
      if (res.ok) {
        setProfileMsg("Profile updated successfully");
        setShowProfileEdit(false);
        setProfile({
          bio: profileForm.bio,
          experience: Number(profileForm.experience) || 0,
          languages: profileForm.languages.split(",").map((s) => s.trim()).filter(Boolean),
          responseTime: profileForm.responseTime,
          price: Number(profileForm.price) || 0,
          portfolio: profileForm.portfolio.split("\n").map((s) => s.trim()).filter(Boolean),
          location: profileForm.location,
          phone: profileForm.phone,
        });
      } else {
        setProfileMsg("Failed to update profile");
      }
    } catch {
      setProfileMsg("Failed to update profile");
    }
    setProfileSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Skeleton className="h-8 w-48 sm:w-64 mb-6 sm:mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalEarned = payouts
    .filter((p) => p.status === "released")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <ProtectedRoute allowedRoles={["artist"]}>
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
          Artist Dashboard
        </h1>

        {fetchError && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-sm text-red-600 dark:text-red-400">
            {fetchError}
          </div>
        )}

        <div className="flex gap-1.5 mb-8 overflow-x-auto pb-1">
          {[
            { href: "/dashboard/artist", label: "Overview", icon: BarChart3 },
            { href: "/dashboard/artist/services", label: "Services", icon: Sparkles },
            { href: "/dashboard/artist/portfolio", label: "Portfolio", icon: Image },
            { href: "/dashboard/artist/bookings", label: "Bookings", icon: Calendar },
            { href: "/dashboard/artist/analytics", label: "Analytics", icon: TrendingUp },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                href === "/dashboard/artist"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "bg-white dark:bg-neutral-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {([
            { icon: Calendar, label: "Total Bookings", value: stats.bookings, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
            { icon: DollarSign, label: "Revenue", value: `MYR ${stats.revenue.toLocaleString()}`, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
            { icon: Star, label: "Rating", value: stats.rating, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
            { icon: TrendingUp, label: "Reviews", value: stats.reviews, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
          ] as const).map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className={`p-4 sm:p-6 ${bg} rounded-2xl border border-gray-100 dark:border-neutral-800`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{label}</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="p-4 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-rose-500" /> Artist Profile
            </h2>
            {!showProfileEdit && (
              <button
                onClick={() => setShowProfileEdit(true)}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {profileMsg && (
            <p className={`text-sm mb-4 ${profileMsg.includes("success") ? "text-green-600" : "text-red-500"}`}>
              {profileMsg}
            </p>
          )}

          {!showProfileEdit ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Bio</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{profile.bio || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Experience</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{profile.experience} years</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Hourly Rate</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">MYR {profile.price}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Response Time</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{profile.responseTime || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Languages</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{profile.languages.join(", ") || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Portfolio Items</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{profile.portfolio.length} images</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bio</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                  placeholder="Tell clients about yourself..."
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Experience (years)</label>
                  <input
                    type="number"
                    min="0"
                    value={profileForm.experience}
                    onChange={(e) => setProfileForm({ ...profileForm, experience: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hourly Rate (MYR)</label>
                  <input
                    type="number"
                    min="0"
                    value={profileForm.price}
                    onChange={(e) => setProfileForm({ ...profileForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Response Time</label>
                  <select
                    value={profileForm.responseTime}
                    onChange={(e) => setProfileForm({ ...profileForm, responseTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <option value="">Select...</option>
                    <option value="< 1hr">{"< 1hr"}</option>
                    <option value="< 2hr">{"< 2hr"}</option>
                    <option value="< 3hr">{"< 3hr"}</option>
                    <option value="< 6hr">{"< 6hr"}</option>
                    <option value="< 24hr">{"< 24hr"}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Languages (comma-separated)</label>
                  <input
                    type="text"
                    value={profileForm.languages}
                    onChange={(e) => setProfileForm({ ...profileForm, languages: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                    placeholder="English, Malay, Mandarin"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                    placeholder="Kuala Lumpur, Malaysia"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                    placeholder="+60 12-345 6789"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Portfolio URLs (one per line)</label>
                <textarea
                  value={profileForm.portfolio}
                  onChange={(e) => setProfileForm({ ...profileForm, portfolio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                  placeholder="https://example.com/photo1.jpg&#10;https://example.com/photo2.jpg"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {profileSaving ? "Saving..." : "Save Profile"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileEdit(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="p-4 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Payouts</h2>
            {bankAccounts.length === 0 && (
              <button
                onClick={() => setShowBankForm(!showBankForm)}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                + Register Bank
              </button>
            )}
          </div>

          {showBankForm && (
            <form onSubmit={handleRegisterBank} className="mb-6 p-4 bg-gray-50 dark:bg-neutral-800 rounded-xl space-y-3">
              <input placeholder="Bank Name (e.g. Maybank, CIMB)" value={bankForm.bankName} onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" required />
              <input placeholder="Account Number" value={bankForm.accountNumber} onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" required />
              <input placeholder="Account Holder Name" value={bankForm.accountHolder} onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" required />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-colors">Save</button>
                <button type="button" onClick={() => setShowBankForm(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Pending Balance</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">MYR {pendingBalance.toLocaleString()}</p>
            </div>
            <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-100 dark:border-green-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">Paid Out</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">MYR {totalEarned.toLocaleString()}</p>
            </div>
            <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Banknote className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Bank Account</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {bankAccounts.length > 0
                  ? `${bankAccounts[0].bankName} •••• ${bankAccounts[0].accountNumber.slice(-4)}`
                  : "Not registered"}
              </p>
            </div>
          </div>

          {payouts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payout History</h3>
              <div className="space-y-2">
                {payouts.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">MYR {Number(p.amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === "released"
                        ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                        : p.status === "pending"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                          : "bg-gray-100 text-gray-600 dark:bg-neutral-700"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm">
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-bold text-gray-900 dark:text-white">All Bookings</h2>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex gap-1 bg-gray-100 dark:bg-neutral-800 rounded-lg p-0.5 overflow-x-auto">
                  {(["all", "upcoming", "completed", "cancelled"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setBookingsFilter(f); setBookingsPage(1); }}
                      className={`whitespace-nowrap px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                        bookingsFilter === f
                          ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <select value={bookingsPerPage} onChange={(e) => { setBookingsPerPage(Number(e.target.value)); setBookingsPage(1); }} className="px-2.5 sm:px-3 py-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-xs sm:text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-500">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>
          </div>

          {paged.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-gray-400 text-sm">No bookings found</div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-neutral-800">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Client</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Service</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Amount</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-neutral-800">
                    {paged.map((b: Booking) => (
                      <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{b.client || b.userName || "—"}</td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{b.service || "—"}</td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{b.date} {b.time || ""}</td>
                        <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">RM {b.price || b.amount || 0}</td>
                        <td className="px-5 py-3">
                          {(() => {
                            switch (b.status) {
                              case "pending": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full">Pending</span>;
                              case "confirmed": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-full">Confirmed</span>;
                              case "completed": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 rounded-full">Completed</span>;
                              case "cancelled": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full">Cancelled</span>;
                              default: return <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-neutral-700 rounded-full">{b.status}</span>;
                            }
                          })()}
                        </td>
                        <td className="px-5 py-3">
                          {b.status === "pending" && (
                            <>
                              <button onClick={() => handleConfirm(b.id)} className="text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 mr-2"><Check className="w-4 h-4" /></button>
                              <button onClick={() => handleReject(b.id)} className="text-xs font-medium text-red-500 hover:text-red-600"><X className="w-4 h-4" /></button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-gray-100 dark:divide-neutral-800">
                {paged.map((b: Booking) => (
                  <div key={b.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{b.client || b.userName || "—"}</span>
                      {(() => {
                        switch (b.status) {
                          case "pending": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full">Pending</span>;
                          case "confirmed": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-full">Confirmed</span>;
                          case "completed": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 rounded-full">Completed</span>;
                          case "cancelled": return <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full">Cancelled</span>;
                          default: return <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-neutral-700 rounded-full">{b.status}</span>;
                        }
                      })()}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Service</span>
                        <span className="text-gray-700 dark:text-gray-300">{b.service || "—"}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Amount</span>
                        <span className="font-semibold text-gray-900 dark:text-white">RM {b.price || b.amount || 0}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Date</span>
                        <span className="text-gray-700 dark:text-gray-300">{b.date} {b.time || ""}</span>
                      </div>
                      <div className="flex items-end">
                        {b.status === "pending" && (
                          <div className="flex gap-2 mt-1">
                            <button onClick={() => handleConfirm(b.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50"><Check className="w-3.5 h-3.5" /> Confirm</button>
                            <button onClick={() => handleReject(b.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50"><X className="w-3.5 h-3.5" /> Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <div className="px-4 sm:px-5 py-4 border-t border-gray-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">Page {bookingsPage} of {totalPages} ({filtered.length} total)</p>
              <div className="flex items-center justify-center gap-1.5">
                <button onClick={() => setBookingsPage((p) => Math.max(1, p - 1))} disabled={bookingsPage <= 1} className="px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setBookingsPage(p)} className={`min-w-[2.25rem] h-9 text-sm font-medium rounded-xl transition-all ${p === bookingsPage ? "bg-rose-500 text-white shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30" : "text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"}`}>{p}</button>
                ))}
                <button onClick={() => setBookingsPage((p) => Math.min(totalPages, p + 1))} disabled={bookingsPage >= totalPages} className="px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
