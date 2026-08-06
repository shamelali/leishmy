"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Shield,
  UserCheck,
  XCircle,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Eye,
  MapPin,
  Briefcase,
  Globe,
  FileText,
  Calendar,
} from "lucide-react";
import { DashboardLoading } from "@/components/DashboardLoading";

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

interface CommunityApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  yearsExperience: number;
  expertiseAreas: string[];
  portfolioImage: string;
  socialProfiles: Record<string, string>;
  certifications: string;
  availability: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

type Tab = "pending" | "all";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:
      "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    approved:
      "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
    rejected:
      "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}
    >
      {status}
    </span>
  );
}

export default function VerificationPage() {
  const [pendingArtists, setPendingArtists] = useState<PendingArtist[]>([]);
  const [communityApps, setCommunityApps] = useState<CommunityApplication[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const fetchCommunityApps = useCallback(async () => {
    try {
      const res = await fetch("/api/admin?action=moderation");
      if (res.ok) {
        const data = await res.json();
        setCommunityApps(data.items || []);
      }
    } catch (e) {
      console.error("Failed to fetch community applications:", e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchPendingArtists(), fetchCommunityApps()]);
      } catch {
        if (!cancelled) setError("Failed to load verification data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPendingArtists, fetchCommunityApps]);

  const handleApprove = async (artistId: string) => {
    if (!confirm("Approve this artist for verification?")) return;
    setActionLoading(`approve-${artistId}`);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve-artist", artistId }),
      });
      if (res.ok) {
        setPendingArtists((prev) => prev.filter((a) => a.id !== artistId));
        setCommunityApps((prev) =>
          prev.map((a) =>
            a.id === artistId ? { ...a, status: "approved" as const } : a,
          ),
        );
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

  const handleReject = async (artistId: string) => {
    const reason = prompt("Enter rejection reason (optional):");
    if (reason === null) return;
    setActionLoading(`reject-${artistId}`);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject-artist",
          artistId,
          reason: reason || null,
        }),
      });
      if (res.ok) {
        setPendingArtists((prev) => prev.filter((a) => a.id !== artistId));
        setCommunityApps((prev) =>
          prev.map((a) =>
            a.id === artistId ? { ...a, status: "rejected" as const } : a,
          ),
        );
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
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-rose-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const pendingCount =
    pendingArtists.length +
    communityApps.filter((a) => a.status === "pending").length;
  const allCount = pendingArtists.length + communityApps.length;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-7 h-7 text-rose-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              KYC Verification
            </h1>
            <p className="text-sm text-gray-500">
              Review and verify makeup artist applications
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-neutral-700">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "pending"
                ? "bg-rose-500 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Eye className="w-4 h-4 inline mr-1" />
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "all"
                ? "bg-rose-500 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-1" />
            All Applications ({allCount})
          </button>
        </div>

        {activeTab === "pending" && (
          <PendingReviewTab
            artists={pendingArtists}
            communityApps={communityApps.filter(
              (a) => a.status === "pending",
            )}
            actionLoading={actionLoading}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}

        {activeTab === "all" && (
          <AllApplicationsTab
            artists={pendingArtists}
            communityApps={communityApps}
            actionLoading={actionLoading}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </div>
    </div>
  );
}

function PendingReviewTab({
  artists,
  communityApps,
  actionLoading,
  onApprove,
  onReject,
}: {
  artists: PendingArtist[];
  communityApps: CommunityApplication[];
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (artists.length === 0 && communityApps.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 text-center py-16">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          No pending applications
        </h3>
        <p className="text-sm text-gray-500">
          All applications have been reviewed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {artists.map((artist) => (
        <ArtistCard
          key={artist.id}
          artist={artist}
          actionLoading={actionLoading}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
      {communityApps.map((app) => (
        <CommunityCard
          key={app.id}
          app={app}
          actionLoading={actionLoading}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}

function AllApplicationsTab({
  artists,
  communityApps,
  actionLoading,
  onApprove,
  onReject,
}: {
  artists: PendingArtist[];
  communityApps: CommunityApplication[];
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (artists.length === 0 && communityApps.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 text-center py-16">
        <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          No applications yet
        </h3>
        <p className="text-sm text-gray-500">
          Applications will appear here once artists apply.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {artists.map((artist) => (
        <ArtistCard
          key={artist.id}
          artist={artist}
          actionLoading={actionLoading}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
      {communityApps.map((app) => (
        <CommunityCard
          key={app.id}
          app={app}
          actionLoading={actionLoading}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}

function ArtistCard({
  artist,
  actionLoading,
  onApprove,
  onReject,
}: {
  artist: PendingArtist;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const isLoading =
    actionLoading === `approve-${artist.id}` ||
    actionLoading === `reject-${artist.id}`;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5">
      <div className="flex items-start gap-4">
        {artist.image ? (
          <Image
            src={artist.image}
            alt={artist.name}
            width={64}
            height={64}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
            <UserCheck className="w-7 h-7 text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {artist.name}
            </h3>
            <StatusBadge status={artist.verified ? "approved" : "pending"} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
            <span>{artist.email}</span>
            {artist.phone && <span>{artist.phone}</span>}
            {artist.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {artist.location}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
            {artist.experience > 0 && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> {artist.experience} years
                experience
              </span>
            )}
            {artist.languages.length > 0 && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />{" "}
                {artist.languages.join(", ")}
              </span>
            )}
            {artist.createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Applied{" "}
                {new Date(artist.createdAt).toLocaleDateString("en-MY", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          {artist.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {artist.specialties.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {artist.bio && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
              {artist.bio}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
          ) : (
            <>
              <button
                onClick={() => onApprove(artist.id)}
                className="px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4 inline mr-1" /> Approve
              </button>
              <button
                onClick={() => onReject(artist.id)}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4 inline mr-1" /> Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CommunityCard({
  app,
  actionLoading,
  onApprove,
  onReject,
}: {
  app: CommunityApplication;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const isLoading =
    actionLoading === `approve-${app.id}` ||
    actionLoading === `reject-${app.id}`;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-5">
      <div className="flex items-start gap-4">
        {app.portfolioImage ? (
          <Image
            src={app.portfolioImage}
            alt={app.name}
            width={64}
            height={64}
            className="w-16 h-16 rounded-xl object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
            <UserCheck className="w-7 h-7 text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {app.name}
            </h3>
            <StatusBadge status={app.status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
            <span>{app.email}</span>
            {app.phone && <span>{app.phone}</span>}
            {app.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {app.city}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
            {app.yearsExperience > 0 && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> {app.yearsExperience} years
                experience
              </span>
            )}
            {app.availability && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {app.availability}
              </span>
            )}
            {app.createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Applied{" "}
                {new Date(app.createdAt).toLocaleDateString("en-MY", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          {app.expertiseAreas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {app.expertiseAreas.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {app.certifications && (
            <div className="flex items-start gap-1.5 text-sm text-gray-500 mb-3">
              <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <p className="line-clamp-2">{app.certifications}</p>
            </div>
          )}

          {app.socialProfiles &&
            Object.keys(app.socialProfiles).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(app.socialProfiles).map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <Globe className="w-3 h-3 mr-1" />
                    {platform}
                  </a>
                ))}
              </div>
            )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
          ) : (
            <>
              <button
                onClick={() => onApprove(app.id)}
                className="px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4 inline mr-1" /> Approve
              </button>
              <button
                onClick={() => onReject(app.id)}
                className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4 inline mr-1" /> Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
