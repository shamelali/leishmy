"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import NextImage from "next/image";
import { useAuth } from "@/context/AuthContext";
import { PortfolioUploader, type PortfolioItem } from "@/components/upload";
import { isAllowedImageUrl } from "@/lib/utils/upload-url";
import { deleteCloudinaryAssets, isSyntheticPublicId } from "@/lib/cloudinary-delete-client";

const MAX_PORTFOLIO_ITEMS = 12;

export default function ArtistPortfolio() {
  const { user } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousRef = useRef<PortfolioItem[]>([]);

  function isCloudinaryPublicId(pid: string): boolean {
    if (!pid || isSyntheticPublicId(pid)) return false;
    return /^leish\//.test(pid);
  }

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetch(`/api/user?action=artist-profile&userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const portfolio: string[] = data?.artist?.portfolio ?? [];
        setItems(
          portfolio
            .filter((url): url is string => typeof url === "string" && isAllowedImageUrl(url))
            .map((url, i) => ({ url, publicId: `existing-${i}` })),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function persistPortfolio(updated: PortfolioItem[]) {
    if (!user?.id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user?action=artist-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          portfolio: updated.map((i) => i.url),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to save portfolio");
      }

      const removed = previousRef.current.filter(
        (p) => !updated.some((n) => n.publicId === p.publicId),
      );
      const deletable = removed
        .map((p) => p.publicId)
        .filter(isCloudinaryPublicId);

      previousRef.current = updated;

      if (deletable.length > 0) {
        try {
          await deleteCloudinaryAssets(deletable);
        } catch (e) {
          console.error("Cloudinary delete failed (will be cleaned by sweep):", e);
          setError(
            `Saved locally, but ${deletable.length} file(s) could not be deleted from Cloudinary. They will be cleaned up automatically.`,
          );
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save portfolio");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(next: PortfolioItem[]) {
    setItems(next);
    persistPortfolio(next);
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard/artist"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
          {saving && (
            <span className="text-xs text-gray-400 inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </span>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
          </div>
        ) : (
          <PortfolioUploader
            value={items}
            onChange={handleChange}
            onError={setError}
            onRemove={(removed) => {
              const pid = removed.publicId;
              if (!isCloudinaryPublicId(pid)) return;
              deleteCloudinaryAssets([pid]).catch((e) => {
                console.error("Cloudinary delete failed (will be cleaned by sweep):", e);
                setError(
                  "Item removed locally, but the file could not be deleted from Cloudinary. It will be cleaned up automatically.",
                );
              });
            }}
            maxItems={MAX_PORTFOLIO_ITEMS}
            folder="portfolio"
            enableUrlPaste
            showPendingTiles
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        )}

        {items.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Live on your profile
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {items.map((item) => (
                <div
                  key={item.publicId}
                  className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100 dark:bg-neutral-800"
                >
                  <NextImage
                    src={item.url}
                    alt="Portfolio"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/90 text-gray-700 hover:bg-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
