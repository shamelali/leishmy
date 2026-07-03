"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Image as ImageIcon, Plus, Trash2, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import NextImage from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function ArtistPortfolio() {
  const { user } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/user?action=artist-profile&userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.artist?.portfolio) setImages(data.artist.portfolio);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const persistPortfolio = async (updated: string[]) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await fetch("/api/user?action=artist-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, portfolio: updated }),
      });
    } catch {}
    setSaving(false);
  };

  const handleAdd = () => {
    if (url.trim()) {
      const updated = [...images, url.trim()];
      setImages(updated);
      setUrl("");
      persistPortfolio(updated);
    }
  };

  const handleDelete = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    persistPortfolio(updated);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/artist" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
          {saving && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</span>}
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste image URL..."
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-16">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">No portfolio images yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((img, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100 dark:bg-neutral-800">
                <NextImage src={img} alt={`Portfolio ${i + 1}`} width={400} height={400} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a href={img} target="_blank" className="p-2 rounded-lg bg-white/90 text-gray-700 hover:bg-white"><ExternalLink className="w-4 h-4" /></a>
                  <button onClick={() => handleDelete(i)} className="p-2 rounded-lg bg-red-500/90 text-white hover:bg-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
