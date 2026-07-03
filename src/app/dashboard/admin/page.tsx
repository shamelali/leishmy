"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";
import {
  Users, Building2, DollarSign, BarChart3, TrendingUp,
  Calendar, Star, Shield, Palette, Store, UserCheck,
  BookOpen, CreditCard, RefreshCw, CheckCircle, XCircle,
  Search, Trash2, ExternalLink, Settings, Flag, FileText,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import Skeleton from "@/components/Skeleton";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

type Tab = "overview" | "artists" | "studios" | "users" | "bookings" | "payments";

interface AdminStats {
  totalUsers: number;
  totalArtists: number;
  totalStudios: number;
  totalBookings: number;
  totalRevenue: number;
  avgRating: number;
  pendingPayouts: number;
  newUsersThisMonth: number;
}

interface Artist { id: string; name: string; email: string; phone: string; location: string; rating: string; reviewCount: number; verified: boolean; available: boolean; createdAt: string; }
interface Studio { id: string; name: string; email: string; phone: string; location: string; rating: string; createdAt: string; }
interface User { id: string; name: string; email: string; role: string; image: string; createdAt: string; }
interface Booking { id: string; date: string; time: string; status: string; paymentStatus: string; totalAmount: string; userName: string; artistName: string; }
interface Payment { id: string; amount: string; status: string; paymentMethod: string; createdAt: string; releasedAt: string; bookingId: string; }

const tabs: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "artists", label: "Artists", icon: Palette },
  { key: "studios", label: "Studios", icon: Store },
  { key: "users", label: "Users", icon: Users },
  { key: "bookings", label: "Bookings", icon: BookOpen },
  { key: "payments", label: "Payments", icon: CreditCard },
];

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    held: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    paid: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
    released: "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
    refunded: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
    failed: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-600 dark:bg-neutral-800"}`}>
      {status}
    </span>
  );
}

export default function DashboardAdmin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [recentActivity, setRecentActivity] = useState<{ action: string; detail: string; time: string; type: string }[]>([]);
  const pageSize = 20;
  const [page, setPage] = useState<Record<Tab, number>>({
    artists: 1, studios: 1, users: 1, bookings: 1, payments: 1, overview: 1,
  });
  const [total, setTotal] = useState<Record<Tab, number>>({
    artists: 0, studios: 0, users: 0, bookings: 0, payments: 0, overview: 0,
  });

  const fetchData = useCallback(async (t: Tab, p?: number) => {
    setLoading(true);
    setFetchError("");
    const currentPage = p ?? page[t];
    try {
      if (t === "overview") {
        const [statsRes, activityRes] = await Promise.all([
          fetch("/api/admin"),
          fetch("/api/admin?action=recent-activity"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        else setFetchError("Failed to load overview data");
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setRecentActivity(activityData.activity || []);
        }
      } else {
        const res = await fetch(`/api/admin?action=${t}&page=${currentPage}&pageSize=${pageSize}`);
        if (res.ok) {
          const data = await res.json();
          if (t === "artists") setArtists(data.artists || []);
          else if (t === "studios") setStudios(data.studios || []);
          else if (t === "users") setUsers(data.users || []);
          else if (t === "bookings") setBookings(data.bookings || []);
          else if (t === "payments") setPayments(data.payments || []);
          setTotal((prev) => ({ ...prev, [t]: data.total || 0 }));
        } else {
          setFetchError(`Failed to load ${t} data`);
        }
      }
    } catch (err) {
      console.error("Admin fetch failed:", err);
      setFetchError("Network error — check your connection");
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    startTransition(() => {
      fetchData(tab);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToPage = (t: Tab, p: number) => {
    setPage((prev) => ({ ...prev, [t]: p }));
    fetchData(t, p);
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setSearch("");
    setPage((prev) => ({ ...prev, [t]: 1 }));
    fetchData(t, 1);
  };

  const toggleVerify = async (artistId: string, verified: boolean) => {
    setActionLoading(artistId);
    try {
      await fetch("/api/admin?action=toggle-verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artistId, verified }) });
      await fetchData("artists");
    } finally { setActionLoading(""); }
  };

  const deleteArtist = async (artistId: string) => {
    if (!confirm("Delete this artist?")) return;
    setActionLoading(artistId);
    try {
      await fetch("/api/admin?action=delete-artist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artistId }) });
      await fetchData("artists");
    } finally { setActionLoading(""); }
  };

  const filterBySearch = <T extends { name?: string; id?: string; email?: string; }>(items: T[]): T[] => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((i) => (i.name || "").toLowerCase().includes(q) || (i.id || "").toLowerCase().includes(q) || (i.email || "").toLowerCase().includes(q));
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform overview and management</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 rounded-full">
            <Shield className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Admin</span>
          </div>
        </div>

        {fetchError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-sm text-red-600 dark:text-red-400">
            {fetchError}
          </div>
        )}

        <div className="flex gap-1 mb-2 overflow-x-auto pb-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => switchTab(key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === key ? "bg-rose-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
          <span className="w-px h-6 bg-gray-200 dark:bg-neutral-700 mx-1 self-center" />
          <Link href="/dashboard/admin/moderation" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
            <Flag className="w-4 h-4" />Moderation
          </Link>
          <Link href="/dashboard/admin/reports" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
            <FileText className="w-4 h-4" />Reports
          </Link>
          <Link href="/dashboard/admin/settings" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
            <Settings className="w-4 h-4" />Settings
          </Link>
        </div>

        {tab !== "overview" && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email, or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>
        )}

        {tab === "overview" && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {loading ? (
                [1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
              ) : (
                [
                  { icon: Users, label: "Total Users", value: stats ? stats.totalUsers.toLocaleString() : "—", sub: stats ? `+${stats.newUsersThisMonth} this month` : "", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
                  { icon: Building2, label: "Artists / Studios", value: stats ? `${stats.totalArtists} / ${stats.totalStudios}` : "—", sub: `${stats ? stats.totalArtists + stats.totalStudios : 0} total vendors`, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30" },
                  { icon: Calendar, label: "Total Bookings", value: stats ? stats.totalBookings.toLocaleString() : "—", sub: "Across all services", color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30" },
                  { icon: DollarSign, label: "Total Revenue", value: stats ? `MYR ${stats.totalRevenue.toLocaleString()}` : "—", sub: stats ? `MYR ${stats.pendingPayouts.toLocaleString()} pending` : "", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
                  { icon: Star, label: "Average Rating", value: stats ? stats.avgRating : "—", sub: "Platform-wide", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30" },
                  { icon: TrendingUp, label: "Growth Rate", value: "+18%", sub: "vs last month", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                  { icon: DollarSign, label: "Pending Payouts", value: stats ? `MYR ${stats.pendingPayouts.toLocaleString()}` : "—", sub: `${Math.ceil((stats?.pendingPayouts || 0) / 350)} payouts`, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30" },
                  { icon: BarChart3, label: "Conversion Rate", value: "12.4%", sub: "Views to bookings", color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
                ].map(({ icon: Icon, label, value, sub, color, bg }) => (
                  <div key={label} className={`p-6 ${bg} rounded-2xl border border-gray-100 dark:border-neutral-800`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${bg}`}><Icon className={`w-5 h-5 ${color}`} /></div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                    <p className="text-xs text-gray-400 mt-1">{sub}</p>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Platform Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                    <div className={`p-1.5 rounded-lg ${item.type === "artist" ? "bg-violet-100 dark:bg-violet-900/30" : item.type === "payment" ? "bg-green-100 dark:bg-green-900/30" : item.type === "booking" ? "bg-blue-100 dark:bg-blue-900/30" : item.type === "user" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
                      {item.type === "artist" ? <Palette className="w-4 h-4 text-violet-500" /> : item.type === "payment" ? <DollarSign className="w-4 h-4 text-green-500" /> : item.type === "booking" ? <Calendar className="w-4 h-4 text-blue-500" /> : item.type === "user" ? <UserCheck className="w-4 h-4 text-amber-500" /> : <BarChart3 className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.action}</p>
                      <p className="text-xs text-gray-400">{item.detail}</p>
                    </div>
                    <span className="text-xs text-gray-400">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "artists" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Location</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Rating</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Verified</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Available</th>
                  <th className="text-right p-3 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {loading ? (
                  <tr><td colSpan={6} className="p-8"><Skeleton className="h-8 w-full" /></td></tr>
                ) : filterBySearch(artists).length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400">No artists found</td></tr>
                ) : filterBySearch(artists).map((artist) => (
                  <tr key={artist.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                    <td className="p-3"><p className="font-medium text-gray-900 dark:text-white">{artist.name}</p><p className="text-xs text-gray-400">{artist.email}</p></td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{artist.location}</td>
                    <td className="p-3"><span className="text-amber-500">{artist.rating}</span><span className="text-xs text-gray-400 ml-1">({artist.reviewCount})</span></td>
                    <td className="p-3">
                      <button onClick={() => toggleVerify(artist.id, !artist.verified)} disabled={actionLoading === artist.id} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${artist.verified ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400"}`}>
                        {actionLoading === artist.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : artist.verified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {artist.verified ? "Verified" : "Unverified"}
                      </button>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${artist.available ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"}`}>
                        {artist.available ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/artists/${artist.id}`} target="_blank" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><ExternalLink className="w-4 h-4" /></a>
                        <button onClick={() => deleteArtist(artist.id)} disabled={actionLoading === artist.id} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total.artists > pageSize && (
              <Pagination page={page.artists} total={total.artists} pageSize={pageSize} onPage={(p) => goToPage("artists", p)} />
            )}
          </div>
        )}

        {tab === "studios" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Name</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Email</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Location</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Rating</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Joined</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {loading ? <tr><td colSpan={5} className="p-8"><Skeleton className="h-8 w-full" /></td></tr>
                : filterBySearch(studios).length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-400">No studios found</td></tr>
                : filterBySearch(studios).map((studio) => (
                    <tr key={studio.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                      <td className="p-3 font-medium text-gray-900 dark:text-white">{studio.name}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{studio.email}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{studio.location}</td>
                      <td className="p-3"><span className="text-amber-500">{studio.rating}</span></td>
                      <td className="p-3 text-gray-400 text-xs">{new Date(studio.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {total.studios > pageSize && (
              <Pagination page={page.studios} total={total.studios} pageSize={pageSize} onPage={(p) => goToPage("studios", p)} />
            )}
          </div>
        )}

          {tab === "users" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Name</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Email</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Role</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Joined</th><th className="text-right p-3 font-semibold text-gray-600 dark:text-gray-300">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {loading ? <tr><td colSpan={5} className="p-8"><Skeleton className="h-8 w-full" /></td></tr>
                : filterBySearch(users).length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-400">No users found</td></tr>
                : filterBySearch(users).map((user) => {
                    const promoting = actionLoading === `promote-${user.id}`;
                    return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                      <td className="p-3 font-medium text-gray-900 dark:text-white">{user.name || "—"}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400" : user.role === "artist" ? "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400" : user.role === "studio" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400" : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400"}`}>{user.role}</span>
                      </td>
                      <td className="p-3 text-gray-400 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        {user.role !== "admin" && (
                          <button
                            onClick={async () => {
                              setActionLoading(`promote-${user.id}`);
                              await fetch("/api/admin?action=set-role", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, role: "admin" }) });
                              setActionLoading("");
                              fetchData("users");
                            }}
                            disabled={promoting}
                            className="px-2 py-1 text-[10px] font-medium rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 disabled:opacity-40"
                          >
                            {promoting ? "..." : "Make Admin"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );})}
              </tbody>
            </table>
            {total.users > pageSize && (
              <Pagination page={page.users} total={total.users} pageSize={pageSize} onPage={(p) => goToPage("users", p)} />
            )}
          </div>
        )}

        {tab === "bookings" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">ID</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Customer</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Artist</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Date</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Status</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Payment</th><th className="text-right p-3 font-semibold text-gray-600 dark:text-gray-300">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {loading ? <tr><td colSpan={7} className="p-8"><Skeleton className="h-8 w-full" /></td></tr>
                : filterBySearch(bookings).length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-gray-400">No bookings found</td></tr>
                : filterBySearch(bookings).map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                      <td className="p-3 font-mono text-xs text-gray-500">{(b.id || "").slice(0, 8)}</td>
                      <td className="p-3 font-medium text-gray-900 dark:text-white">{b.userName || "—"}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{b.artistName || "—"}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{b.date}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${b.status === "confirmed" ? "bg-green-50 text-green-600 dark:bg-green-950/30" : b.status === "pending" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30" : b.status === "cancelled" ? "bg-red-50 text-red-600 dark:bg-red-950/30" : b.status === "completed" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30" : "bg-gray-100 text-gray-600 dark:bg-neutral-800"}`}>{b.status}</span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${b.paymentStatus === "paid" || b.paymentStatus === "released" ? "bg-green-50 text-green-600 dark:bg-green-950/30" : b.paymentStatus === "held" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30" : b.paymentStatus === "pending" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30" : "bg-gray-100 text-gray-600 dark:bg-neutral-800"}`}>{b.paymentStatus}</span>
                      </td>
                      <td className="p-3 text-right font-medium text-gray-900 dark:text-white">MYR {b.totalAmount}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {total.bookings > pageSize && (
              <Pagination page={page.bookings} total={total.bookings} pageSize={pageSize} onPage={(p) => goToPage("bookings", p)} />
            )}
          </div>
        )}

        {tab === "payments" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">ID</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Booking</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Amount</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Status</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Method</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Created</th><th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {loading ? <tr><td colSpan={7} className="p-8"><Skeleton className="h-8 w-full" /></td></tr>
                : filterBySearch(payments).length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-gray-400">No payments found</td></tr>
                : filterBySearch(payments).map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                      <td className="p-3 font-mono text-xs text-gray-500">{(p.id || "").slice(0, 8)}</td>
                      <td className="p-3 font-mono text-xs text-gray-500">{(p.bookingId || "").toString().slice(0, 8) || "—"}</td>
                      <td className="p-3 font-medium text-gray-900 dark:text-white">MYR {p.amount}</td>
                      <td className="p-3"><PaymentBadge status={p.status} /></td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 capitalize">{p.paymentMethod || "—"}</td>
                      <td className="p-3 text-xs text-gray-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {p.status === "held" && (
                            <button onClick={async () => {
                              if (!confirm("Release this payment?")) return;
                              setActionLoading(`release-${p.id}`);
                              await fetch("/api/payments?action=release", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId: p.id }) });
                              setActionLoading(""); fetchData("payments");
                            }} disabled={actionLoading === `release-${p.id}`} className="px-2 py-1 text-xs font-medium rounded-lg bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-40">
                              {actionLoading === `release-${p.id}` ? "..." : "Release"}
                            </button>
                          )}
                          {(p.status === "paid" || p.status === "held") && (
                            <button onClick={async () => {
                              if (!confirm("Refund this payment?")) return;
                              setActionLoading(`refund-${p.id}`);
                              await fetch("/api/payments?action=refund", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentId: p.id }) });
                              setActionLoading(""); fetchData("payments");
                            }} disabled={actionLoading === `refund-${p.id}`} className="px-2 py-1 text-xs font-medium rounded-lg bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-40">
                              {actionLoading === `refund-${p.id}` ? "..." : "Refund"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {total.payments > pageSize && (
              <Pagination page={page.payments} total={total.payments} pageSize={pageSize} onPage={(p) => goToPage("payments", p)} />
            )}
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}

function Pagination({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="px-4 sm:px-5 py-4 border-t border-gray-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
        Page {page} of {totalPages} ({total} total)
      </p>
      <div className="flex items-center justify-center gap-1.5">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className="px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const start = Math.max(1, Math.min(page - 2, totalPages - 4));
          const p = start + i;
          if (p > totalPages) return null;
          return (
            <button key={p} onClick={() => onPage(p)} className={`min-w-[2.25rem] h-9 text-sm font-medium rounded-xl transition-all ${p === page ? "bg-rose-500 text-white shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30" : "text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"}`}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className="px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
