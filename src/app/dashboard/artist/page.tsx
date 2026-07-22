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
  Share2,
  Banknote,
  Wallet,
  Clock,
  User,
  Sparkles,
  Image,
  AtSign,
  Award,
  Languages,
  Tag,
  MessageSquare,
} from "lucide-react";
import Skeleton from "@/components/Skeleton";
import StatCard from "@/components/StatCard";
import ClientDetailsModal from "@/components/ClientDetailsModal";
import { useAuth } from "@/context/AuthContext";
import { ArtistProfileEditForm, type ArtistProfileEditValues } from "@/components/ArtistProfileEditForm";

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

interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  message: string;
  status: string;
  createdAt: string;
}

interface Booking {
  id: string;
  artistId?: string;
  artistName?: string;
  client?: string;
  userName?: string;
  clientEmail?: string;
  clientPhone?: string;
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

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [artistId, setArtistId] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    type: "booking" | "inquiry";
    data: any;
  }>({ isOpen: false, type: "booking", data: null });
  const [profile, setProfile] = useState<ArtistProfileEditValues>({
    name: "",
    email: "",
    phone: "",
    image: "",
    location: "",
    area: "",
    district: "",
    bio: "",
    experience: 0,
    languages: [],
    specialties: [],
    portfolio: [],
    responseTime: "",
    price: 0,
    certifications: "",
    availability: "",
    availabilityNotes: "",
    socialProfiles: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const [payoutRes, bookingsRes, profileRes] = await Promise.all([
          fetch(`/api/payments?action=payouts&userId=${user.id}`),
          fetch(`/api/user/bookings`),
          fetch(`/api/user/artist-profile`),
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
            const social = [
              a.instagramUrl || "",
              a.tiktokUrl || "",
            ].filter(Boolean).join("\n");

            setProfile({
              name: a.name || user.name || "",
              email: a.email || user.email || "",
              phone: a.phone || "",
              image: a.image || "",
              location: a.location || "",
              area: a.area || "",
              district: a.district || "",
              bio: a.bio || "",
              experience: a.experience || 0,
              languages: a.languages || [],
              specialties: a.specialties || [],
              portfolio: a.portfolio || [],
              responseTime: a.responseTime || "",
              price: a.price || 0,
              certifications: a.certifications || "",
              availability: a.availability || "",
              availabilityNotes: a.availability || "",
              socialProfiles: social,
            });

            setArtistId(a.id);

            const inquiriesRes = await fetch(`/api/inquiries?artistId=${a.id}`);
            if (inquiriesRes.ok) {
              const inquiriesData = await inquiriesRes.json();
              setInquiries(inquiriesData.inquiries || []);
            }
          }
        }
      } catch {
        setFetchError("Network error — check your connection");
      }
      setLoading(false);
    };
    fetchData();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    await fetch(`/api/user/confirm-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, userId: user?.id }),
    });
    setBookings((prev: Booking[]) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "confirmed" } : b)),
    );
  };

  const handleReject = async (bookingId: string) => {
    await fetch(`/api/user/reject-booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, userId: user?.id }),
    });
    setBookings((prev: Booking[]) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b)),
    );
  };

  const handleProfileSaved = (values: ArtistProfileEditValues) => {
    setProfile(values);
    setProfileMsg("Profile updated successfully");
    setTimeout(() => setShowProfileEdit(false), 1200);
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

        <ClientDetailsModal
          isOpen={detailsModal.isOpen}
          onClose={() => setDetailsModal({ isOpen: false, type: "booking", data: null })}
          type={detailsModal.type}
          data={detailsModal.data || {}}
        />
      </div>
    );
  }

  const totalEarned = payouts
    .filter((p) => p.status === "released")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
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
            { icon: Calendar, label: "Total Bookings", value: String(stats.bookings), color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
            { icon: DollarSign, label: "Revenue", value: `MYR ${stats.revenue.toLocaleString()}`, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
            { icon: Star, label: "Rating", value: String(stats.rating), color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
            { icon: TrendingUp, label: "Reviews", value: String(stats.reviews), color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
          ] as const).map((props) => (
            <StatCard key={props.label} {...props} />
          ))}
        </div>

        <Link
          href="/dashboard/artist/share"
          className="block p-4 sm:p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-8 text-white hover:opacity-90 transition-opacity group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Share & Earn</h3>
              <p className="text-sm text-white/80 mt-1">
                Share your profile and earn 200 loyalty points per referral booking
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/20 rounded-lg px-4 py-2 group-hover:bg-white/30 transition-colors">
              <Share2 className="w-4 h-4" /> Open
            </div>
          </div>
        </Link>

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
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Display Name</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{profile.name || "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Email</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 break-all">{profile.email || "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Phone</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{profile.phone || "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Location</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {[profile.district, profile.area, profile.location].filter(Boolean).join(", ") || "Not set"}
                  </p>
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
                  <p className="text-xs text-gray-400 mb-1">Availability</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {profile.availability
                      ? profile.availability
                          .replace(/weekdays/gi, "Weekdays")
                          .replace(/weekends/gi, "Weekends")
                          .replace(/both/gi, "Weekdays & Weekends")
                          .replace(/evenings/gi, "Evenings only")
                          .replace(/flexible/gi, "Flexible / By appointment")
                          .replace(/custom/gi, "Custom")
                      : "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Portfolio Items</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{profile.portfolio.length} item(s)</p>
                </div>
              </div>

              {profile.bio && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Bio</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{profile.bio}</p>
                </div>
              )}

              {(profile.languages.length > 0 || profile.specialties.length > 0) && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {profile.languages.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                        <Languages className="w-3.5 h-3.5" /> Languages
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.languages.map((l) => (
                          <span key={l} className="px-2 py-0.5 text-xs font-medium rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/50">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.specialties.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" /> Specialties
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.specialties.map((s) => (
                          <span key={s} className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {profile.certifications && (
                <div>
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Certifications & Training
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{profile.certifications}</p>
                </div>
              )}

              {profile.socialProfiles && (
                <div>
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <AtSign className="w-3.5 h-3.5" /> Social Profiles
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line break-all">{profile.socialProfiles}</p>
                </div>
              )}
            </div>
          ) : (
            <ArtistProfileEditForm
              initial={profile}
              onSaved={handleProfileSaved}
              onCancel={() => {
                setShowProfileEdit(false);
                setProfileMsg("");
              }}
            />
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
                {bankAccounts.length > 0 && bankAccounts[0].bankName
                  ? `${bankAccounts[0].bankName}${
                      bankAccounts[0].accountNumber
                        ? ` •••• ${bankAccounts[0].accountNumber.slice(-4)}`
                        : ""
                    }`
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

        <div className="p-4 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-rose-500" /> Inquiries ({inquiries.length})
          </h2>
          {inquiries.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No inquiries yet</p>
          ) : (
            <div className="space-y-3">
               {inquiries.filter((i) => i.status === "pending").map((inq) => (
                 <div
                   key={inq.id}
                   onClick={() => setDetailsModal({ isOpen: true, type: "inquiry", data: inq })}
                   className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/50 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                 >
                   <div className="flex items-start justify-between gap-3 mb-2">
                     <div>
                       <p className="font-semibold text-gray-900 dark:text-white text-sm">{inq.name}</p>
                       <p className="text-xs text-gray-500">{inq.email}</p>
                     </div>
                     <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full">New</span>
                   </div>
                   <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{inq.message}</p>
                   <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                     {inq.phone && <span>{inq.phone}</span>}
                     {inq.location && <span>{inq.location}</span>}
                     <span>{new Date(inq.createdAt).toLocaleDateString()}</span>
                   </div>
                 </div>
               ))}
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
                      <tr
                        key={b.id}
                        onClick={() => setDetailsModal({ isOpen: true, type: "booking", data: b })}
                        className="hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                      >
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
                              <button onClick={(e) => { e.stopPropagation(); handleConfirm(b.id); }} className="text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 mr-2"><Check className="w-4 h-4" /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleReject(b.id); }} className="text-xs font-medium text-red-500 hover:text-red-600"><X className="w-4 h-4" /></button>
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
                  <div
                    key={b.id}
                    onClick={() => setDetailsModal({ isOpen: true, type: "booking", data: b })}
                    className="p-4 space-y-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/50 rounded-xl transition-colors"
                  >
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
                            <button onClick={(e) => { e.stopPropagation(); handleConfirm(b.id); }} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50"><Check className="w-3.5 h-3.5" /> Confirm</button>
                            <button onClick={(e) => { e.stopPropagation(); handleReject(b.id); }} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50"><X className="w-3.5 h-3.5" /> Reject</button>
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
  );
}
