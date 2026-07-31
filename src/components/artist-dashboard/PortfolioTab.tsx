"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, GripVertical, Plus, ImageIcon, ZoomIn } from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";

interface PortfolioTabProps {
  portfolio: string[];
  userId: string;
  onUpdate: (portfolio: string[]) => void;
}

export default function PortfolioTab({ portfolio: initialPortfolio, userId, onUpdate }: PortfolioTabProps) {
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [uploading, setUploading] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  async function savePortfolio(newPortfolio: string[]) {
    setPortfolio(newPortfolio);
    onUpdate(newPortfolio);
    await fetch("/api/user/artist-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, portfolio: newPortfolio }),
    });
  }

  function removeItem(index: number) {
    const newPortfolio = portfolio.filter((_, i) => i !== index);
    savePortfolio(newPortfolio);
  }

  function moveItem(fromIndex: number, direction: "up" | "down") {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= portfolio.length) return;
    const newPortfolio = [...portfolio];
    [newPortfolio[fromIndex], newPortfolio[toIndex]] = [newPortfolio[toIndex], newPortfolio[fromIndex]];
    savePortfolio(newPortfolio);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) return;
    if (file.size > MAX_FILE_SIZE) return;

    setUploading(true);
    try {
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "portfolio", publicIdPrefix: "port", resourceType: "image" }),
      });

      if (!signRes.ok) throw new Error("Could not start upload");
      const sign = await signRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sign.apiKey);
      form.append("timestamp", String(sign.timestamp));
      form.append("signature", sign.signature);
      form.append("folder", sign.folder);
      form.append("allowed_formats", sign.allowedFormats.join(","));
      form.append("max_file_size", String(sign.maxFileSize));
      if (sign.publicId) form.append("public_id", sign.publicId);

      const uploadRes = await fetch(sign.uploadUrl, { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("Upload failed");

      const data = await uploadRes.json();
      savePortfolio([...portfolio, data.secure_url]);
    } catch {
      // silently fail
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleAddLink() {
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    if (portfolio.includes(trimmed)) return;
    savePortfolio([...portfolio, trimmed]);
    setLinkInput("");
    setShowLinkInput(false);
  }

  function isImageUrl(url: string) {
    return /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url) || url.includes("cloudinary.com");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {portfolio.length} item{portfolio.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload
          </button>
          <button
            onClick={() => setShowLinkInput(!showLinkInput)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Link
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileUpload}
        className="hidden"
      />

      {showLinkInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
          />
          <button
            onClick={handleAddLink}
            className="px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {portfolio.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-gray-300 dark:text-neutral-600" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">No portfolio items yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">
            Upload images or add links to showcase your work
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {portfolio.map((url, i) => (
            <div
              key={`${url}-${i}`}
              onClick={() => isImageUrl(url) && setLightboxIndex(i)}
              className={`group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 ${isImageUrl(url) ? "cursor-pointer" : ""}`}
            >
              {isImageUrl(url) ? (
                <img
                  src={url}
                  alt={`Portfolio ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 break-all text-center line-clamp-3">
                    {url}
                  </span>
                </div>
              )}

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                {isImageUrl(url) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                    className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                    title="View full size"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-700" />
                  </button>
                )}
                {i > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); moveItem(i, "up"); }}
                    className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                    title="Move left"
                  >
                    <GripVertical className="w-4 h-4 text-gray-700 -rotate-90" />
                  </button>
                )}
                {i < portfolio.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); moveItem(i, "down"); }}
                    className="p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                    title="Move right"
                  >
                    <GripVertical className="w-4 h-4 text-gray-700 rotate-90" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(i); }}
                  className="p-1.5 bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                  title="Remove"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Index badge */}
              <span className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center bg-black/50 text-white text-[10px] font-bold rounded-full">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
       )}

       {lightboxIndex !== null && (
         <ImageLightbox
           images={portfolio.filter(isImageUrl)}
           initialIndex={lightboxIndex}
           alt="Portfolio"
           onClose={() => setLightboxIndex(null)}
         />
       )}
     </div>
   );
 }
