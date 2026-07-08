"use client";

import { useEffect, useRef, useState } from "react";
import { CloudUpload, Loader2, X, Image as ImageIcon, AlertCircle, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import ImageWithFallback from "@/components/ImageWithFallback";
import { validateImageFile } from "@/lib/utils/magic-bytes";
import { isAllowedImageUrl, sanitizeImageUrl } from "@/lib/utils/upload-url";

export type PortfolioItem = {
  url: string;
  publicId: string;
  alt?: string;
};

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  eager: string;
  allowedFormats: string[];
  maxFileSize: number;
  resourceType: "image" | "video";
  uploadUrl: string;
};

type PendingUpload = {
  id: string;
  previewUrl: string;
  name: string;
  status: "uploading" | "error";
  error?: string;
};

export interface PortfolioUploaderProps {
  value: PortfolioItem[];
  onChange: (items: PortfolioItem[]) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  maxItems?: number;
  folder?: string;
  labels?: {
    dropzone?: string;
    dropzoneHint?: string;
    counter?: (current: number, max: number) => string;
    addUrl?: string;
    addUrlPlaceholder?: string;
    addUrlInvalid?: string;
  };
  /**
   * Show a "paste an image URL" mode. Useful for the dashboard where users
   * sometimes prefer to link an existing hosted image.
   */
  enableUrlPaste?: boolean;
  /**
   * Show per-item delete buttons. Defaults to true.
   */
  allowRemove?: boolean;
  /**
   * Show per-item loading + error state for in-flight uploads.
   * Useful for the dashboard which renders pending tiles alongside completed ones.
   */
  showPendingTiles?: boolean;
  /**
   * Aspect ratio of the grid tiles. Default "1:1".
   */
  aspectRatio?: string;
  /**
   * Sizes attribute for the Next/Image component.
   */
  sizes?: string;
}

const DEFAULT_LABELS = {
  dropzone: "Drag and drop, or click to browse",
  dropzoneHint: "Up to {max} images, 10 MB each",
  addUrl: "Or paste an image URL",
  addUrlPlaceholder: "https://res.cloudinary.com/...",
  addUrlInvalid: "URL must be HTTPS and on an allowlisted host (e.g. res.cloudinary.com).",
};

export function PortfolioUploader({
  value,
  onChange,
  onError,
  disabled,
  maxItems = 12,
  folder = "portfolio",
  labels,
  enableUrlPaste = false,
  allowRemove = true,
  showPendingTiles = true,
  aspectRatio = "1:1",
  sizes = "(max-width: 640px) 50vw, 25vw",
}: PortfolioUploaderProps) {
  const t = useTranslations("artistOnboarding.wizard.portfolio");
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const dropzone = labels?.dropzone ?? t("dropzone");
  const dropzoneHint = (labels?.dropzoneHint ?? t("dropzoneHint")).replace(
    "{max}",
    String(maxItems),
  );
  const counter = labels?.counter
    ? labels.counter(value.length, maxItems)
    : t("counter", { current: value.length, max: maxItems });
  const addUrlLabel = labels?.addUrl ?? DEFAULT_LABELS.addUrl;
  const addUrlPlaceholder = labels?.addUrlPlaceholder ?? DEFAULT_LABELS.addUrlPlaceholder;
  const addUrlInvalid = labels?.addUrlInvalid ?? DEFAULT_LABELS.addUrlInvalid;

  useEffect(() => {
    return () => {
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reportError(message: string) {
    setUrlError(null);
    onError?.(message);
  }

  async function uploadFile(file: File) {
    if (disabled) return;
    if (value.length + pending.length >= maxItems) {
      reportError(`Maximum ${maxItems} images allowed.`);
      return;
    }

    const validationError = await validateImageFile(file);
    if (validationError) {
      reportError(validationError);
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const previewUrl = URL.createObjectURL(file);
    setPending((p) => [...p, { id, previewUrl, name: file.name, status: "uploading" }]);
    setProgress(file.name);

    try {
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder,
          publicIdPrefix: "p",
          resourceType: "image",
        }),
      });
      if (!signRes.ok) {
        const err = (await signRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Could not start upload");
      }
      const sign = (await signRes.json()) as SignResponse;

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sign.apiKey);
      form.append("timestamp", String(sign.timestamp));
      form.append("signature", sign.signature);
      form.append("folder", sign.folder);
      form.append("eager", sign.eager);
      form.append("allowed_formats", sign.allowedFormats.join(","));
      form.append("max_file_size", String(sign.maxFileSize));

      const uploadRes = await fetch(sign.uploadUrl, { method: "POST", body: form });
      if (!uploadRes.ok) {
        // Read the response body so users (and we) can see why Cloudinary
        // rejected the upload. Without this, every failure looks the same.
        const body = (await uploadRes.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        const msg =
          body?.error?.message || `Upload failed (HTTP ${uploadRes.status})`;
        throw new Error(msg);
      }
      const data = (await uploadRes.json()) as {
        secure_url: string;
        public_id: string;
        eager?: { secure_url: string }[];
      };
      const finalUrl =
        data.eager && data.eager[0]?.secure_url ? data.eager[0].secure_url : data.secure_url;

      const next: PortfolioItem = { url: finalUrl, publicId: data.public_id };
      URL.revokeObjectURL(previewUrl);
      setPending((p) => p.filter((x) => x.id !== id));
      onChange([...value, next]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      setPending((p) =>
        p.map((x) => (x.id === id ? { ...x, status: "error", error: message } : x)),
      );
      onError?.(message);
    } finally {
      setProgress(null);
    }
  }

  async function handleFiles(list: FileList | File[] | null) {
    if (!list) return;
    const files = Array.from(list).slice(0, maxItems - value.length - pending.length);
    for (const file of files) {
      await uploadFile(file);
    }
  }

  function removeItem(publicId: string) {
    onChange(value.filter((item) => item.publicId !== publicId));
  }

  function dismissPending(id: string) {
    setPending((p) => {
      const target = p.find((x) => x.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return p.filter((x) => x.id !== id);
    });
  }

  function handleAddUrl() {
    setUrlError(null);
    const clean = urlInput.trim();
    if (!clean) return;
    if (value.length + pending.length >= maxItems) {
      setUrlError(`Maximum ${maxItems} images allowed.`);
      return;
    }
    if (!isAllowedImageUrl(clean)) {
      setUrlError(addUrlInvalid);
      return;
    }
    const safe = sanitizeImageUrl(clean);
    if (!safe) {
      setUrlError(addUrlInvalid);
      return;
    }
    const syntheticId = `url-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    onChange([...value, { url: safe, publicId: syntheticId }]);
    setUrlInput("");
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`rounded-2xl border-2 border-dashed p-6 sm:p-10 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20"
            : "border-gray-200 dark:border-neutral-700 hover:border-rose-300"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <CloudUpload className="w-10 h-10 text-rose-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{dropzone}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{dropzoneHint}</p>
        {progress && (
          <p className="mt-3 text-xs text-rose-600 dark:text-rose-400 inline-flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {progress}
          </p>
        )}
      </div>

      {enableUrlPaste && (
        <div className="rounded-xl border border-gray-200 dark:border-neutral-800 p-3 space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{addUrlLabel}</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              placeholder={addUrlPlaceholder}
              className="form-input flex-1 min-w-0"
              maxLength={500}
            />
            <button
              type="button"
              onClick={handleAddUrl}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl bg-rose-500 text-white hover:bg-rose-600"
            >
              <Plus className="w-4 h-4" /> {t("add")}
            </button>
          </div>
          {urlError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 inline-flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {urlError}
            </p>
          )}
        </div>
      )}

      {(value.length > 0 || (showPendingTiles && pending.length > 0)) && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {showPendingTiles &&
            pending.map((p) => (
              <li
                key={p.id}
                className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800 aspect-square bg-gray-50 dark:bg-neutral-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.previewUrl}
                  alt={p.name}
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-white text-xs px-2 text-center">
                  {p.status === "uploading" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="truncate w-full">Uploading {p.name}…</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-300" />
                      <span className="line-clamp-2">{p.error}</span>
                      <button
                        type="button"
                        onClick={() => dismissPending(p.id)}
                        className="mt-1 px-2 py-1 rounded bg-white/20 hover:bg-white/30"
                      >
                        {t("dismiss")}
                      </button>
                    </>
                  )}
                </div>
                {p.status === "uploading" && (
                  <button
                    type="button"
                    onClick={() => dismissPending(p.id)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                    aria-label="Cancel upload"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          {value.map((item) => (
            <li
              key={item.publicId}
              className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800 aspect-square bg-gray-50 dark:bg-neutral-900"
            >
              <ImageWithFallback
                src={item.url}
                alt={item.alt ?? ""}
                className="w-full h-full object-cover"
                aspectRatio={aspectRatio}
                sizes={sizes}
              />
              {allowRemove && (
                <button
                  type="button"
                  onClick={() => removeItem(item.publicId)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">{counter}</p>
    </div>
  );
}

export default PortfolioUploader;
