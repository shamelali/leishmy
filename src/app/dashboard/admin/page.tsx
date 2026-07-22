"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";
import {
  Users, Building2, DollarSign, BarChart3, TrendingUp,
  Calendar, Star, Shield, Palette, Store, UserCheck,
  BookOpen, CreditCard, RefreshCw, CheckCircle, XCircle,
  Search, Trash2, ExternalLink, Settings, Flag, FileText,
  ChevronLeft, ChevronRight, Mail, MessageSquare, X, MoreHorizontal,
  Webhook,
} from "lucide-react";
import Skeleton from "@/components/Skeleton";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/context/AuthContext";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

interface ReceivedEmail {
  id: string;
  recipient: string;
  sender: string;
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  source: string | null;
  createdAt: string;
}

type Tab = "overview" | "artists" | "studios" | "users" | "bookings" | "payments" | "events" | "inbox" | "webhooks";

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
interface Booking { id: string; date: string; time: string; status: string; paymentStatus: string; totalAmount: string; userName: string; artistName: string; notes: string; location: string; }
interface Payment { id: string; amount: string; status: string; paymentMethod: string; createdAt: string; releasedAt: string; bookingId: string; userName: string; userEmail: string; }
interface AdminEvent { id: number; title: string; slug: string; date: string; time: string | null; location: string | null; category: string; published: boolean; featured: boolean; }

const tabs: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "artists", label: "Artists", icon: Palette },
  { key: "studios", label: "Studios", icon: Store },
  { key: "users", label: "Users", icon: Users },
  { key: "bookings", label: "Bookings", icon: BookOpen },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "events", label: "Events", icon: Calendar },
  { key: "inbox", label: "Inbox", icon: Mail },
  { key: "webhooks", label: "Webhooks", icon: Webhook },
];

interface WebhookEvent { id: number; event: string; status: string; createdAt: string; payload: any; }
interface WebhookReconcile { paymentId: number; billplzId: string | null; billplzPaid: boolean | null; localStatus: string | null; }

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
  const isMobile = useIsMobile();
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
  const [showAddArtist, setShowAddArtist] = useState(false);
  const [addArtistForm, setAddArtistForm] = useState({ name: "", email: "", phone: "", location: "", image: "", bio: "", price: "" });
  const [adminEvents, setAdminEvents] = useState<AdminEvent[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [addEventForm, setAddEventForm] = useState({ title: "", description: "", date: "", time: "", location: "", category: "Workshop", image: "", ticketUrl: "", organizerName: "", published: false });
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [editEventForm, setEditEventForm] = useState({ title: "", description: "", date: "", time: "", location: "", category: "Workshop", image: "", ticketUrl: "", organizerName: "", published: false });
  const [receivedEmails, setReceivedEmails] = useState<ReceivedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [webhookReconcile, setWebhookReconcile] = useState<WebhookReconcile[]>([]);
  const [webhookSummary, setWebhookSummary] = useState<{ total: number; received: number; rejected: number }>({ total: 0, received: 0, rejected: 0 });
  const [webhookSyncing, setWebhookSyncing] = useState<number | null>(null);
  const [expandedEmailGroup, setExpandedEmailGroup] = useState<string | null>(null);
  const [overviewDetail, setOverviewDetail] = useState<string | null>(null);
  const [overviewDetailData, setOverviewDetailData] = useState<any>(null);
  const [overviewDetailLoading, setOverviewDetailLoading] = useState(false);
  const pageSize = 20;
  const [page, setPage] = useState<Record<Tab, number>>({
    artists: 1, studios: 1, users: 1, bookings: 1, payments: 1, events: 1, inbox: 1, webhooks: 1, overview: 1,
  });
  const [total, setTotal] = useState<Record<Tab, number>>({
    artists: 0, studios: 0, users: 0, bookings: 0, payments: 0, events: 0, inbox: 0, webhooks: 0, overview: 0,
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
      } else if (t === "inbox") {
        const res = await fetch(`/api/admin?action=received-emails&limit=${pageSize}&offset=${(currentPage - 1) * pageSize}`);
        if (res.ok) {
          const data = await res.json();
          setReceivedEmails(data.emails || []);
          setTotal((prev) => ({ ...prev, inbox: data.total || 0 }));
        } else {
          setFetchError("Failed to load inbox");
        }
      } else if (t === "webhooks") {
        const res = await fetch(`/api/admin?action=webhooks&limit=${pageSize}`);
        if (res.ok) {
          const data = await res.json();
          setWebhookEvents(data.events || []);
          setWebhookReconcile(data.reconcile || []);
          setWebhookSummary(data.summary || { total: 0, received: 0, rejected: 0 });
          setTotal((prev) => ({ ...prev, webhooks: data.summary?.total || 0 }));
        } else {
          setFetchError("Failed to load webhook data");
        }
      } else if (t === "events") {
        const res = await fetch("/api/events?admin=true");
        if (res.ok) {
          const data = await res.json();
          setAdminEvents(data);
          setTotal((prev) => ({ ...prev, events: data.length }));
        } else {
          setFetchError("Failed to load events");
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

  const fetchOverviewDetail = async (type: string) => {
    setOverviewDetail(type);
    setOverviewDetailLoading(true);
    setOverviewDetailData(null);
    try {
      let url = "";
      if (type === "users") url = "/api/admin?action=users&page=1&pageSize=50";
      else if (type === "artists") url = "/api/admin?action=artists&page=1&pageSize=50";
      else if (type === "bookings") url = "/api/admin?action=bookings&page=1&pageSize=50";
      else if (type === "payments") url = "/api/admin?action=payments&page=1&pageSize=50";
      else if (type === "revenue") url = "/api/admin?action=payments&page=1&pageSize=100";
      else if (type === "pending") url = "/api/admin?action=payments&page=1&pageSize=100";
      if (url) {
        const res = await fetch(url);
        if (res.ok) setOverviewDetailData(await res.json());
      }
    } catch (e) { console.error(e); }
    setOverviewDetailLoading(false);
  };

  const reconcilePayment = async (paymentId: number) => {
    setWebhookSyncing(paymentId);
    try {
      const res = await fetch("/api/admin?action=reconcile-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      if (res.ok) {
        await fetchData("webhooks");
      } else {
        setFetchError("Reconcile failed");
      }
    } finally {
      setWebhookSyncing(null);
    }
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
    <>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform overview and management</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 rounded-full self-start sm:self-auto">
            <Shield className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Admin</span>
          </div>
        </div>

        {fetchError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-sm text-red-600 dark:text-red-400">
            {fetchError}
          </div>
        )}

        <div className="flex gap-1 mb-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => switchTab(key)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === key ? "bg-rose-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
          <span className="w-px h-6 bg-gray-200 dark:neutral-700 mx-1 self-center hidden sm:inline" />
          <Link href="/dashboard/admin/moderation" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
            <Flag className="w-4 h-4" />Moderation
          </Link>
          <Link href="/dashboard/admin/reports" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
            <FileText className="w-4 h-4" />Reports
          </Link>
          <Link href="/dashboard/admin/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
            <Settings className="w-4 h-4" />Settings
          </Link>
          <Link href="/dashboard/admin/people" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
            <Users className="w-4 h-4" />People
          </Link>
        </div>

        {tab !== "overview" && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email, or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>
        )}

        {tab === "overview" && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {loading ? (
                [1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
              ) : (
                [
                  { icon: Users, label: "Total Users", value: stats ? stats.totalUsers.toLocaleString() : "—", sub: stats ? `+${stats.newUsersThisMonth} this month` : "", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", clickType: "users" },
                  { icon: Building2, label: "Artists / Studios", value: stats ? `${stats.totalArtists} / ${stats.totalStudios}` : "—", sub: `${stats ? stats.totalArtists + stats.totalStudios : 0} total vendors`, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30", clickType: "artists" },
                  { icon: Calendar, label: "Total Bookings", value: stats ? stats.totalBookings.toLocaleString() : "—", sub: "Across all services", color: "text-green-500", bg: "bg-green-50 dark:bg-green-950/30", clickType: "bookings" },
                  { icon: DollarSign, label: "Total Revenue", value: stats ? `MYR ${stats.totalRevenue.toLocaleString()}` : "—", sub: stats ? `MYR ${stats.pendingPayouts.toLocaleString()} pending` : "", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", clickType: "revenue" },
                  { icon: Star, label: "Average Rating", value: stats ? String(stats.avgRating) : "—", sub: "Platform-wide", color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30", clickType: null },
                  { icon: TrendingUp, label: "Growth Rate", value: "+18%", sub: "vs last month", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", clickType: null },
                  { icon: DollarSign, label: "Pending Payouts", value: stats ? `MYR ${stats.pendingPayouts.toLocaleString()}` : "—", sub: `${Math.ceil((stats?.pendingPayouts || 0) / 350)} payouts`, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30", clickType: "pending" },
                  { icon: BarChart3, label: "Conversion Rate", value: "12.4%", sub: "Views to bookings", color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/30", clickType: null },
                ].map((props) => (
                  <button
                    key={props.label}
                    onClick={() => props.clickType && fetchOverviewDetail(props.clickType)}
                    className={`text-left ${props.clickType ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform" : "cursor-default"}`}
                  >
                    <StatCard {...props} size="lg" />
                  </button>
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
            <div className="px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {total.artists} artist{total.artists !== 1 ? "s" : ""} total
              </p>
              <button
                onClick={() => setShowAddArtist(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-all shadow-sm"
              >
                <UserCheck className="w-4 h-4" /> Add Artist
              </button>
            </div>

            {showAddArtist && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowAddArtist(false)}>
                <div className={`bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 w-full max-w-lg ${isMobile ? 'max-w-full mx-0 rounded-none h-full max-h-full' : ''} overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add New Artist</h3>
                  <div className="space-y-3">
                    {(["name", "email", "phone", "location", "image", "bio", "price"] as const).map((field) => {
                      const isTextarea = field === "bio";
                      const placeholder = field === "image" ? "https://images.unsplash.com/..." : `Enter ${field}`;
                      return (
                        <div key={field}>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{field}</label>
                          {isTextarea ? (
                            <textarea
                              rows={3}
                              value={addArtistForm[field]}
                              onChange={(e) => setAddArtistForm((f) => ({ ...f, [field]: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                              placeholder={placeholder}
                            />
                          ) : (
                            <input
                              type={field === "email" ? "email" : "text"}
                              value={addArtistForm[field]}
                              onChange={(e) => setAddArtistForm((f) => ({ ...f, [field]: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
                              placeholder={placeholder}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-6">
                    <button onClick={() => setShowAddArtist(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all">
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!addArtistForm.name.trim()) return;
                        setActionLoading("create");
                        try {
                          await fetch("/api/admin?action=create-artist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addArtistForm) });
                          setShowAddArtist(false);
                          setAddArtistForm({ name: "", email: "", phone: "", location: "", image: "", bio: "", price: "" });
                          await fetchData("artists");
                        } finally { setActionLoading(""); }
                      }}
                      disabled={actionLoading === "create" || !addArtistForm.name.trim()}
                      className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-40 transition-all"
                    >
                      {actionLoading === "create" ? "Creating..." : "Create Artist"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
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
                        <a href={`/artists/${artist.id}`} target="_blank" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><ExternalLink className="w-4 h-4" /></a>
                        <button onClick={() => deleteArtist(artist.id)} disabled={actionLoading === artist.id} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {total.artists > pageSize && (
              <Pagination page={page.artists} total={total.artists} pageSize={pageSize} onPage={(p) => goToPage("artists", p)} />
            )}
          </div>
        )}

        {tab === "studios" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Email</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Location</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Rating</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {loading ? (
                  <tr><td colSpan={5} className="p-8"><Skeleton className="h-8 w-full" /></td></tr>
                ) : filterBySearch(studios).length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400">No studios found</td></tr>
                ) : filterBySearch(studios).map((studio) => (
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
            </div>
            {total.studios > pageSize && (
              <Pagination page={page.studios} total={total.studios} pageSize={pageSize} onPage={(p) => goToPage("studios", p)} />
            )}
          </div>
        )}

          {tab === "users" && (
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-8"><Skeleton className="h-8 w-full" /></div>
            ) : filterBySearch(users).length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-8 text-center text-gray-400">No users found</div>
            ) : (() => {
                const filtered = filterBySearch(users);
                const grouped = {
                  admin: filtered.filter((u) => u.role === "admin"),
                  artist: filtered.filter((u) => u.role === "artist"),
                  studio: filtered.filter((u) => u.role === "studio"),
                  customer: filtered.filter((u) => u.role === "customer" || u.role === "client"),
                };
                const roleConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Users }> = {
                  admin: { label: "Admins", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30", icon: Shield },
                  artist: { label: "Artists", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30", icon: Palette },
                  studio: { label: "Studios", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", icon: Building2 },
                  customer: { label: "Customers", color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-neutral-800", icon: Users },
                };
                return Object.entries(grouped).filter(([, items]) => items.length > 0).map(([role, items]) => {
                  const cfg = roleConfig[role];
                  const RoleIcon = cfg.icon;
                  return (
                    <div key={role} className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
                      <div className="px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-neutral-800 flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${cfg.bg}`}>
                          <RoleIcon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <h3 className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</h3>
                        <span className="text-xs text-gray-400 ml-auto">{items.length} user{items.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[600px]">
                          <thead className="bg-gray-50 dark:bg-neutral-800">
                            <tr>
                              <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                              <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Email</th>
                              <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Joined</th>
                              <th className="text-right p-3 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                            {items.map((user) => {
                              const promoting = actionLoading === `promote-${user.id}`;
                              return (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                                  <td className="p-3 font-medium text-gray-900 dark:text-white">{user.name || "—"}</td>
                                  <td className="p-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                                  <td className="p-3 text-gray-400 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                                  <td className="p-3 text-right">
                                    {user.role !== "admin" && (
                                      <button
                                        onClick={async () => {
                                          if (!confirm("Make this user an admin? This action is irreversible.")) return;
                                          setActionLoading(`promote-${user.id}`);
                                          await fetch("/api/admin?action=set-role", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, role: "admin" }) });
                                          setActionLoading("");
                                          fetchData("users");
                                        }}
                                        disabled={promoting}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 disabled:opacity-40 touch-target"
                                      >
                                        {promoting ? "..." : "Make Admin"}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                });
              })()
            }
            {total.users > pageSize && (
              <Pagination page={page.users} total={total.users} pageSize={pageSize} onPage={(p) => goToPage("users", p)} />
            )}
          </div>
        )}

        {tab === "bookings" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">ID</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Customer</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Artist</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Location</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Payment</th>
                  <th className="text-right p-3 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {loading ? (
                  <tr><td colSpan={9} className="p-8"><Skeleton className="h-8 w-full" /></td></tr>
                ) : filterBySearch(bookings).length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-gray-400">No bookings found</td></tr>
                ) : filterBySearch(bookings).map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer" onClick={() => setSelectedEmail({ ...b, id: b.id, subject: `Booking #${b.id}`, sender: b.userName, recipient: b.artistName, bodyText: b.notes || "No notes", bodyHtml: null, createdAt: b.date, source: "booking" })}>
                      <td className="p-3 font-mono text-xs text-gray-500">{(b.id || "").slice(0, 8)}</td>
                      <td className="p-3 font-medium text-gray-900 dark:text-white">{b.userName || "—"}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{b.artistName || "—"}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">{b.date}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 text-sm">{b.location || "—"}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${b.status === "confirmed" ? "bg-green-50 text-green-600 dark:bg-green-950/30" : b.status === "pending" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30" : b.status === "cancelled" ? "bg-red-50 text-red-600 dark:bg-red-950/30" : b.status === "completed" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30" : "bg-gray-100 text-gray-600 dark:bg-neutral-800"}`}>{b.status}</span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${b.paymentStatus === "paid" || b.paymentStatus === "released" ? "bg-green-50 text-green-600 dark:bg-green-950/30" : b.paymentStatus === "held" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30" : b.paymentStatus === "pending" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30" : "bg-gray-100 text-gray-600 dark:bg-neutral-800"}`}>{b.paymentStatus}</span>
                      </td>
                      <td className="p-3 text-right font-medium text-gray-900 dark:text-white">MYR {b.totalAmount}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 text-sm max-w-[200px] truncate" title={b.notes || "No notes"}>
                        {b.notes ? (b.notes.length > 60 ? b.notes.slice(0, 60) + "..." : b.notes) : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            </div>
            {total.bookings > pageSize && (
              <Pagination page={page.bookings} total={total.bookings} pageSize={pageSize} onPage={(p) => goToPage("bookings", p)} />
            )}
          </div>
        )}

        {tab === "events" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {total.events} event{total.events !== 1 ? "s" : ""}
              </p>
              <button
                onClick={() => setShowAddEvent(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white text-sm font-semibold rounded-xl hover:bg-rose-600 transition-all shadow-sm"
              >
                <Calendar className="w-4 h-4" /> Add Event
              </button>
            </div>

            {showAddEvent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowAddEvent(false)}>
                <div className={`bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 w-full max-w-lg ${isMobile ? 'max-w-full mx-0 rounded-none h-full max-h-full' : ''} overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add New Event</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Title *</label>
                      <input type="text" value={addEventForm.title} onChange={(e) => setAddEventForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Description</label>
                      <textarea rows={3} value={addEventForm.description} onChange={(e) => setAddEventForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Date *</label>
                        <input type="date" value={addEventForm.date} onChange={(e) => setAddEventForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Time</label>
                        <input type="time" value={addEventForm.time} onChange={(e) => setAddEventForm((f) => ({ ...f, time: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Location</label>
                        <input type="text" value={addEventForm.location} onChange={(e) => setAddEventForm((f) => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Category</label>
                        <select value={addEventForm.category} onChange={(e) => setAddEventForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400">
                          <option value="Workshop">Workshop</option>
                          <option value="Expo">Expo</option>
                          <option value="Masterclass">Masterclass</option>
                          <option value="Competition">Competition</option>
                          <option value="Networking">Networking</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Image URL</label>
                      <input type="text" value={addEventForm.image} onChange={(e) => setAddEventForm((f) => ({ ...f, image: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400" placeholder="https://..." />
                      {addEventForm.image && (
                        <div className="mt-2 relative group">
                          <img src={addEventForm.image} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                          <button
                            type="button"
                            onClick={() => setAddEventForm((f) => ({ ...f, image: "" }))}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Ticket URL</label>
                      <input type="url" value={addEventForm.ticketUrl} onChange={(e) => setAddEventForm((f) => ({ ...f, ticketUrl: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Organizer Name</label>
                      <input type="text" value={addEventForm.organizerName} onChange={(e) => setAddEventForm((f) => ({ ...f, organizerName: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={addEventForm.published} onChange={(e) => setAddEventForm((f) => ({ ...f, published: e.target.checked }))} className="rounded border-gray-300 text-rose-500 focus:ring-rose-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</span>
                    </label>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-6">
                    <button onClick={() => setShowAddEvent(false)} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all">Cancel</button>
                    <button
                      onClick={async () => {
                        if (!addEventForm.title.trim() || !addEventForm.date) return;
                        setActionLoading("create-event");
                        try {
                          await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addEventForm) });
                          setShowAddEvent(false);
                          setAddEventForm({ title: "", description: "", date: "", time: "", location: "", category: "Workshop", image: "", ticketUrl: "", organizerName: "", published: false });
                          fetchData("events");
                        } finally { setActionLoading(""); }
                      }}
                      disabled={actionLoading === "create-event" || !addEventForm.title.trim() || !addEventForm.date}
                      className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-40 transition-all"
                    >
                      {actionLoading === "create-event" ? "Creating..." : "Create Event"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {editingEvent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setEditingEvent(null)}>
                <div className={`bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 w-full max-w-lg ${isMobile ? 'max-w-full mx-0 rounded-none h-full max-h-full' : ''} overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit Event</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Title *</label>
                      <input type="text" value={editEventForm.title} onChange={(e) => setEditEventForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Description</label>
                      <textarea rows={3} value={editEventForm.description} onChange={(e) => setEditEventForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Date *</label>
                        <input type="date" value={editEventForm.date} onChange={(e) => setEditEventForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Time</label>
                        <input type="time" value={editEventForm.time} onChange={(e) => setEditEventForm((f) => ({ ...f, time: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Location</label>
                        <input type="text" value={editEventForm.location} onChange={(e) => setEditEventForm((f) => ({ ...f, location: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Category</label>
                        <select value={editEventForm.category} onChange={(e) => setEditEventForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-400">
                          <option value="Workshop">Workshop</option>
                          <option value="Expo">Expo</option>
                          <option value="Masterclass">Masterclass</option>
                          <option value="Competition">Competition</option>
                          <option value="Networking">Networking</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Image URL</label>
                      <input type="text" value={editEventForm.image} onChange={(e) => setEditEventForm((f) => ({ ...f, image: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400" placeholder="https://..." />
                      {editEventForm.image && (
                        <div className="mt-2 relative group">
                          <img src={editEventForm.image} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                          <button
                            type="button"
                            onClick={() => setEditEventForm((f) => ({ ...f, image: "" }))}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Ticket URL</label>
                      <input type="url" value={editEventForm.ticketUrl} onChange={(e) => setEditEventForm((f) => ({ ...f, ticketUrl: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Organizer Name</label>
                      <input type="text" value={editEventForm.organizerName} onChange={(e) => setEditEventForm((f) => ({ ...f, organizerName: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editEventForm.published} onChange={(e) => setEditEventForm((f) => ({ ...f, published: e.target.checked }))} className="rounded border-gray-300 text-rose-500 focus:ring-rose-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Published</span>
                    </label>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-6">
                    <button onClick={() => setEditingEvent(null)} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all">Cancel</button>
                    <button
                      onClick={async () => {
                        if (!editEventForm.title.trim() || !editEventForm.date) return;
                        setActionLoading("edit-event");
                        try {
                          await fetch("/api/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingEvent.id, ...editEventForm }) });
                          setEditingEvent(null);
                          fetchData("events");
                        } finally { setActionLoading(""); }
                      }}
                      disabled={actionLoading === "edit-event" || !editEventForm.title.trim() || !editEventForm.date}
                      className="px-4 py-2 text-sm font-semibold rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-40 transition-all"
                    >
                      {actionLoading === "edit-event" ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Image</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Title</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Location</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Category</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="text-right p-3 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {loading ? (
                  <tr><td colSpan={7} className="p-8"><Skeleton className="h-8 w-full" /></td></tr>
                ) : adminEvents.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">No events found</td></tr>
                ) : adminEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                    <td className="p-3">
                      {(ev as any).image && (ev as any).image !== "/placeholder.svg" ? (
                        <img src={(ev as any).image} alt={ev.title} className="w-12 h-12 object-cover rounded-lg" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-medium text-gray-900 dark:text-white">{ev.title}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{new Date(ev.date).toLocaleDateString()}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">{ev.location || "—"}</td>
                    <td className="p-3"><span className="px-2 py-1 text-xs font-medium rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">{ev.category}</span></td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${ev.published ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400" : "bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400"}`}>
                          {ev.published ? "Published" : "Draft"}
                        </span>
                        {ev.featured && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">Featured</span>}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingEvent(ev);
                            setEditEventForm({
                              title: ev.title,
                              description: (ev as any).description || "",
                              date: ev.date?.split("T")[0] || "",
                              time: ev.time || "",
                              location: ev.location || "",
                              category: ev.category,
                              image: (ev as any).image || "",
                              ticketUrl: (ev as any).ticketUrl || "",
                              organizerName: (ev as any).organizerName || "",
                              published: ev.published,
                            });
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 dark:bg-neutral-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 touch-target"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            setActionLoading(`pub-${ev.id}`);
                            await fetch("/api/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ev.id, published: !ev.published }) });
                            setActionLoading(""); fetchData("events");
                          }}
                          disabled={actionLoading === `pub-${ev.id}`}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-40 touch-target"
                        >
                          {ev.published ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm("Delete this event?")) return;
                            setActionLoading(`del-${ev.id}`);
                            await fetch(`/api/events?id=${ev.id}`, { method: "DELETE" });
                            setActionLoading(""); fetchData("events");
                          }}
                          disabled={actionLoading === `del-${ev.id}`}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-40 touch-target"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {tab === "inbox" && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-8"><Skeleton className="h-8 w-full" /></div>
            ) : receivedEmails.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-8 text-center text-gray-400">No emails received yet. Set up forwarding in Cloudflare Email Routing.</div>
            ) : (() => {
                const grouped: Record<string, ReceivedEmail[]> = {};
                receivedEmails.forEach((email) => {
                  const senderName = email.sender.split("@")[0].replace(/[._-]/g, " ").trim();
                  if (!grouped[senderName]) grouped[senderName] = [];
                  grouped[senderName].push(email);
                });
                const sortedGroups = Object.entries(grouped).sort((a, b) => {
                  const latestA = Math.max(...a[1].map((e) => new Date(e.createdAt).getTime()));
                  const latestB = Math.max(...b[1].map((e) => new Date(e.createdAt).getTime()));
                  return latestB - latestA;
                });
                return sortedGroups.map(([senderName, emails]) => (
                  <div key={senderName} className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
                    <button
                      onClick={() => setExpandedEmailGroup(expandedEmailGroup === senderName ? null : senderName)}
                      className="w-full px-4 sm:px-5 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-left"
                    >
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30">
                        <Mail className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{senderName}</p>
                        <p className="text-xs text-gray-400">{emails.length} email{emails.length !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(emails[0].createdAt).toLocaleDateString()}</span>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedEmailGroup === senderName ? "rotate-90" : ""}`} />
                    </button>
                    {expandedEmailGroup === senderName && (
                      <div className="border-t border-gray-100 dark:border-neutral-800 divide-y divide-gray-100 dark:divide-neutral-800">
                        {emails.map((email) => (
                          <button
                            key={email.id}
                            onClick={() => setSelectedEmail(email)}
                            className="w-full px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{email.subject || "(no subject)"}</p>
                              <p className="text-xs text-gray-400 truncate">{email.bodyText?.slice(0, 80) || email.bodyHtml?.replace(/<[^>]+>/g, "").slice(0, 80) || "No content"}</p>
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(email.createdAt).toLocaleString()}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ));
              })()
            }
            {total.inbox > pageSize && (
              <Pagination page={page.inbox} total={total.inbox} pageSize={pageSize} onPage={(p) => goToPage("inbox", p)} />
            )}
          </div>
        )}

        {tab === "webhooks" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Webhook Events" value={String(webhookSummary.total)} icon={Webhook} color="text-gray-600 dark:text-gray-300" bg="bg-gray-100 dark:bg-neutral-800" />
              <StatCard label="Received" value={String(webhookSummary.received)} icon={CheckCircle} color="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-950/30" />
              <StatCard label="Rejected (bad sig)" value={String(webhookSummary.rejected)} icon={XCircle} color="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-950/30" />
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Reconciliation — paid on Billplz but not yet synced</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">These payments are still pending/held locally while Billplz reports them paid. Click sync to update.</p>
              </div>
              {webhookReconcile.length === 0 ? (
                <p className="p-6 text-center text-gray-400">No pending/held payments to reconcile. 🎉</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead className="bg-gray-50 dark:bg-neutral-800">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Payment</th>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Billplz ID</th>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Local Status</th>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Billplz Paid</th>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                      {webhookReconcile.map((r) => (
                        <tr key={r.paymentId}>
                          <td className="p-3 font-medium text-gray-900 dark:text-white">{r.paymentId}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-300 text-xs break-all">{r.billplzId}</td>
                          <td className="p-3"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">{r.localStatus}</span></td>
                          <td className="p-3">{r.billplzPaid === null ? <span className="text-gray-400">lookup failed</span> : r.billplzPaid ? <span className="text-green-600 dark:text-green-400">yes</span> : <span className="text-gray-400">no</span>}</td>
                          <td className="p-3">
                            <button
                              disabled={webhookSyncing === r.paymentId}
                              onClick={() => reconcilePayment(r.paymentId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${webhookSyncing === r.paymentId ? "animate-spin" : ""}`} />
                              {webhookSyncing === r.paymentId ? "Syncing…" : "Sync"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-neutral-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Webhook Event Log</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Every Billplz callback we receive (or reject) is recorded here for verification.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="bg-gray-50 dark:bg-neutral-800">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">ID</th>
                      <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Event</th>
                      <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                      <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Received</th>
                      <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                    {loading ? (
                      <tr><td colSpan={5} className="p-8"><Skeleton className="h-8 w-full" /></td></tr>
                    ) : webhookEvents.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-400">No webhook events recorded yet.</td></tr>
                    ) : webhookEvents.map((e) => (
                      <tr key={e.id}>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">{e.id}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{e.event}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${e.status === "rejected" ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400" : "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"}`}>{e.status}</span>
                        </td>
                        <td className="p-3 text-gray-400 text-xs">{new Date(e.createdAt).toLocaleString()}</td>
                        <td className="p-3 text-gray-500 dark:text-gray-400 text-xs max-w-[320px] truncate" title={JSON.stringify(e.payload)}>{JSON.stringify(e.payload)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "payments" && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">ID</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Booking</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Method</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Created</th>
                  <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {loading ? (
                  <tr><td colSpan={8} className="p-8"><Skeleton className="h-8 w-full" /></td></tr>
                ) : filterBySearch(payments).length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-400">No payments found</td></tr>
                ) : filterBySearch(payments).map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                      <td className="p-3 font-mono text-xs text-gray-500">{(p.id || "").slice(0, 8)}</td>
                      <td className="p-3">
                        <p className="font-medium text-gray-900 dark:text-white">{p.userName || "—"}</p>
                        {p.userEmail && <p className="text-xs text-gray-400">{p.userEmail}</p>}
                      </td>
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
            </div>
            {total.payments > pageSize && (
              <Pagination page={page.payments} total={total.payments} pageSize={pageSize} onPage={(p) => goToPage("payments", p)} />
            )}
          </div>
        )}
      </div>

      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedEmail(null)}>
          <div className={`bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col ${isMobile ? 'max-w-full mx-0 rounded-none h-full max-h-full' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedEmail.subject || "(no subject)"}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">From: {selectedEmail.sender} · To: {selectedEmail.recipient}</p>
              </div>
              <button onClick={() => setSelectedEmail(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {selectedEmail.bodyHtml ? (
                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }} />
              ) : selectedEmail.bodyText ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-neutral-800 p-4 rounded-xl">{selectedEmail.bodyText}</pre>
              ) : (
                <p className="text-gray-400 dark:text-gray-500">No message content available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {overviewDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setOverviewDetail(null)}>
          <div className={`bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col ${isMobile ? 'max-w-full mx-0 rounded-none h-full max-h-full' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-neutral-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {overviewDetail === "revenue" ? "Revenue Details" : overviewDetail === "pending" ? "Pending Payouts" : `All ${overviewDetail}`}
              </h2>
              <button onClick={() => setOverviewDetail(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {overviewDetailLoading ? (
                <div className="p-8"><Skeleton className="h-8 w-full" /></div>
              ) : !overviewDetailData ? (
                <p className="text-center text-gray-400 p-8">No data available</p>
              ) : overviewDetail === "users" || overviewDetail === "artists" ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-neutral-800">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Email</th>
                        {overviewDetail === "artists" && <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Rating</th>}
                        {overviewDetail === "artists" && <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Verified</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                      {(overviewDetail === "users" ? overviewDetailData.users : overviewDetailData.artists)?.map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                          <td className="p-3 font-medium text-gray-900 dark:text-white">{item.name || "—"}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-300">{item.email}</td>
                          {overviewDetail === "artists" && <td className="p-3 text-amber-500">{item.rating || "0"}</td>}
                          {overviewDetail === "artists" && <td className="p-3">{item.verified ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : overviewDetail === "bookings" ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-neutral-800">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Customer</th>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Artist</th>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                        <th className="text-right p-3 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                      {overviewDetailData.bookings?.map((b: any) => (
                        <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                          <td className="p-3 font-medium text-gray-900 dark:text-white">{b.userName || "—"}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-300">{b.artistName || "—"}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-300">{b.date}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${b.status === "confirmed" ? "bg-green-50 text-green-600" : b.status === "pending" ? "bg-amber-50 text-amber-600" : b.status === "completed" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"}`}>{b.status}</span>
                          </td>
                          <td className="p-3 text-right font-medium text-gray-900 dark:text-white">MYR {b.totalAmount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (overviewDetail === "payments" || overviewDetail === "revenue" || overviewDetail === "pending") ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-neutral-800">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">ID</th>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                        <th className="text-left p-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                      {(overviewDetailData.payments || [])
                        .filter((p: any) => overviewDetail === "pending" ? p.status === "held" : overviewDetail === "revenue" ? (p.status === "paid" || p.status === "released") : true)
                        .map((p: any) => (
                          <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                            <td className="p-3 font-mono text-xs text-gray-500">{(p.id || "").slice(0, 8)}</td>
                            <td className="p-3 font-medium text-gray-900 dark:text-white">{p.userName || "—"}</td>
                            <td className="p-3 font-medium text-gray-900 dark:text-white">MYR {p.amount}</td>
                            <td className="p-3"><PaymentBadge status={p.status} /></td>
                            <td className="p-3 text-xs text-gray-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Pagination({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  const isMobile = useIsMobile();
  return (
    <div className="flex items-center justify-center gap-1 p-4 border-t border-gray-100 dark:border-neutral-800 flex-wrap">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} className={`p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-30 text-gray-600 dark:text-gray-400 ${isMobile ? 'min-w-[44px] min-h-[44px]' : ''}`}><ChevronLeft className="w-5 h-5" /></button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onPage(p)} className={`px-3 py-2 rounded-lg text-sm font-medium ${p === page ? "bg-rose-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"} ${isMobile ? 'min-w-[44px] min-h-[44px]' : ''}`}>{p}</button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages} className={`p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-30 text-gray-600 dark:text-gray-400 ${isMobile ? 'min-w-[44px] min-h-[44px]' : ''}`}><ChevronRight className="w-5 h-5" /></button>
    </div>
  );
}
