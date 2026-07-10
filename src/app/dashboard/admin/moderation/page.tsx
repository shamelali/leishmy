"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield, Check, X, ChevronLeft, AlertTriangle, Sparkles,
  MapPin, Star, BadgeCheck, Clock, MessageSquare,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Skeleton from "@/components/Skeleton";

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

export default function ModerationPage() {
  const [artists, setArtists] = useState<PendingArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin?action=pending-artists&pageSize=50");
      if (res.ok) {
        const data = await res.json();
        setArtists(data.artists || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (artistId: string) => {
    setActionLoading(artistId);
    try {
      await fetch("/api/admin?action=approve-artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId }),
      });
      setArtists((prev) => prev.filter((a) => a.id !== artistId));
    } catch {}
    setActionLoading(null);
  };

  const handleReject = async (artistId: string) => {
    setActionLoading(artistId);
    try {
      await fetch("/api/admin?action=reject-artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId, reason: rejectReason || "Not approved at this time" }),
      });
      setArtists((prev) => prev.filter((a) => a.id !== artistId));
      setRejectId(null);
      setRejectReason("");
    } catch {}
    setActionLoading(null);
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-rose-500 transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <Shield className="w-7 h-7 text-rose-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Artist Moderation</h1>
                <p className="text-sm text-gray-500">Review and approve new artist applications</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : artists.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
              <BadgeCheck className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">All caught up!</h3>
              <p className="text-sm text-gray-500">No pending artist verifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{artist.name}</h3>
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {artist.location && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {artist.location}</span>
                        )}
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> {artist.rating}</span>
                        <span>MYR {artist.price}</span>
                        <span>{artist.experience} yr{artist.experience !== 1 ? "s" : ""} exp</span>
                        <span>Joined {new Date(artist.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      {artist.bio && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{artist.bio}</p>
                      )}
                      {artist.specialties && artist.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {(artist.specialties as string[]).map((s) => (
                            <span key={s} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{artist.email}</span>
                        {artist.phone && <span>{artist.phone}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(artist.id)}
                        disabled={actionLoading === artist.id}
                        className="px-4 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                      >
                        {actionLoading === artist.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Approve
                      </button>

                      {rejectId === artist.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason..."
                            className="w-36 px-2.5 py-2 text-xs rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 outline-none focus:ring-2 focus:ring-rose-400"
                            autoFocus
                          />
                          <button
                            onClick={() => handleReject(artist.id)}
                            disabled={actionLoading === artist.id}
                            className="px-3 py-2 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => { setRejectId(null); setRejectReason(""); }}
                            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRejectId(artist.id)}
                          className="px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg hover:border-red-300 hover:text-red-600 transition-colors flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
