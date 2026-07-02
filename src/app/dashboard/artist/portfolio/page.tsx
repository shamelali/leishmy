"use client";

import { useState } from "react";
import Link from "next/link";
import { Image as ImageIcon, Plus, Trash2, ArrowLeft, ExternalLink } from "lucide-react";
import NextImage from "next/image";

export default function ArtistPortfolio() {
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
    "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400",
  ]);
  const [url, setUrl] = useState("");

  const handleAdd = () => {
    if (url.trim()) {
      setImages([...images, url.trim()]);
      setUrl("");
    }
  };

  const handleDelete = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard/artist" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
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

        {images.length === 0 ? (
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
