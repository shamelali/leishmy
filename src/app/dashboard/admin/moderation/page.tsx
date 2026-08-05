"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Flag, UserCheck, XCircle, MessageSquare, ChevronLeft, Loader2, Shield, AlertTriangle, Eye, Trash2 } from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";
import ProtectedRoute from "@/components/ProtectedRoute";

interface ModerationItem {
  id: number;
  type: string;
  from: string;
  target: string;
  reason: string;
  status: string;
  date: string;
}

interface PendingArtist {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  location: string;
  image: string;
  bio: string;
  rating: string;
  price: string;
  specialties: string[];
  languages: string[];
  experience: number;
  verified: boolean;
  createdAt: string;
}

interface ModerationStats {
  contacts: number;
  pendingArtists: number;
}

export default function ModerationPage() {
  const [contacts, setContacts] = useState<ModerationItem[]>([]);
  const [pendingArtists, setPendingArtists] = useState<PendingArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"contacts" | "artists">("contacts");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin?action=moderation");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.items || []);
      }
    } catch (e) {
      console.error("Failed to fetch contacts:", e);
    }
  }, []);

  const fetchPendingArtists = useCallback(async () => {
    try {
      const res = await fetch("/api/admin?action=pending-artists&pageSize=100");
      if (res.ok) {
        const data = await res.json();
        setPendingArtists(data.artists || []);
      }
    } catch (e) {
      console.error("Failed to fetch pending artists:", e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      startTransition(() => {
        setLoading(true);
        setError(null);
      });
      try {
        await Promise.all([fetchContacts(), fetchPendingArtists()]);
      } finally {
        if (!cancelled) {
          startTransition(() => setLoading(false));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [fetchContacts, fetchPendingArtists]);

  const handleResolveContact = async (id: number) => {
    if (!confirm("Mark this contact message as resolved and remove it?")) return;
    setActionLoading(`contact-${id}`);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve-item", id, type: "contact" }),
      });
      if (res.ok) {
        setContacts(contacts.filter(c => c.id !== id));
      } else {
        alert("Failed to resolve contact");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to resolve contact");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveArtist = async (artistId: string) => {
    if (!confirm("Approve this artist for verification?")) return;
    setActionLoading(`approve-${artistId}`);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve-artist", artistId }),
      });
      if (res.ok) {
        setPendingArtists(pendingArtists.filter(a => a.id !== artistId));
      } else {
        alert("Failed to approve artist");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to approve artist");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectArtist = async (artistId: string) => {
    const reason = prompt("Enter rejection reason (optional):");
    setActionLoading(`reject-${artistId}`);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject-artist", artistId, reason: reason || null }),
      });
      if (res.ok) {
        setPendingArtists(pendingArtists.filter(a => a.id !== artistId));
      } else {
        alert("Failed to reject artist");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to reject artist");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <DashboardLoading fullPage />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-300 dark:text-red-600 mx-auto mb-4" />
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm text-rose-600 hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-rose-500 transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <Flag className="w-7 h-7 text-rose-500" />
              <div className="mt-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moderation Queue</h1>
                <p className="text-sm text-gray-500">Review and manage pending items</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-neutral-700">
            <button
              onClick={() => setActiveTab("contacts")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "contacts"
                ? "bg-rose-500 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"}`}
            >
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Contact Messages ({contacts.length})
            </button>
            <button
              onClick={() => setActiveTab("artists")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "artists"
                ? "bg-rose-500 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"}`}
            >
              <Shield className="w-4 h-4 inline mr-1" />
              Pending Artists ({pendingArtists.length})
            </button>
          </div>

          {activeTab === "contacts" && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
              {contacts.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No contact messages</h3>
                  <p className="text-sm text-gray-500">All caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {contacts.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900 dark:text-white">{item.from}</span>
                            <span className="text-xs text-gray-400">{item.target}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.status === "pending"
                                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                                : "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">{item.reason}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(item.date).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {actionLoading === `contact-${item.id}` ? (
                            <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
                          ) : (
                            <button
                              onClick={() => handleResolveContact(item.id)}
                              className="px-3 py-1.5 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 inline mr-1" /> Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "artists" && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden">
              {pendingArtists.length === 0 ? (
                <div className="text-center py-16">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No pending artists</h3>
                  <p className="text-sm text-gray-500">All artist applications have been reviewed.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {pendingArtists.map((artist) => (
                    <div key={artist.id} className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {artist.image ? (
                            <Image src={artist.image} alt={artist.name} width={56} height={56} className="w-14 h-14 rounded-full object-cover" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                              <UserCheck className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white truncate">{artist.name}</span>
                              {artist.slug && <span className="text-xs text-gray-400">/{artist.slug}</span>}
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">{artist.email}</div>
                            {artist.location && (
                              <div className="text-xs text-gray-400 mt-0.5">{artist.location}</div>
                            )}
                            {artist.bio && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{artist.bio}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {(actionLoading === `approve-${artist.id}` || actionLoading === `reject-${artist.id}`) ? (
                            <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
                          ) : (
                            <>
                              <button
                                onClick={() => handleApproveArtist(artist.id)}
                                className="px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
                              >
                                <UserCheck className="w-4 h-4 inline mr-1" /> Approve
                              </button>
                              <button
                                onClick={() => handleRejectArtist(artist.id)}
                                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                              >
                                <XCircle className="w-4 h-4 inline mr-1" /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}