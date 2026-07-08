"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X, User } from "lucide-react";
import { validateImageFile } from "@/lib/utils/magic-bytes";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string[];
  maxFileSize: number;
  uploadUrl: string;
  publicId?: string;
};

export interface ProfilePictureUploaderProps {
  value: string;
  onChange: (url: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  folder?: string;
  size?: "sm" | "md" | "lg";
}

export function ProfilePictureUploader({
  value,
  onChange,
  onError,
  disabled,
  folder = "profile",
  size = "md",
}: ProfilePictureUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-28 h-28",
    lg: "w-36 h-36",
  };

  const iconSize = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    const validationError = await validateImageFile(file);
    if (validationError) {
      onError?.(validationError);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    try {
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder,
          publicIdPrefix: "avatar",
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
      form.append("allowed_formats", sign.allowedFormats.join(","));
      form.append("max_file_size", String(sign.maxFileSize));
      if (sign.publicId) {
        form.append("public_id", sign.publicId);
      }

      const uploadRes = await fetch(sign.uploadUrl, { method: "POST", body: form });
      if (!uploadRes.ok) {
        const body = (await uploadRes.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(body?.error?.message || `Upload failed (HTTP ${uploadRes.status})`);
      }

      const data = (await uploadRes.json()) as { secure_url: string };
      onChange(data.secure_url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      onError?.(message);
      setPreview(null);
    } finally {
      setUploading(false);
      if (localPreview) URL.revokeObjectURL(localPreview);
    }
  }

  function handleRemove() {
    onChange("");
    setPreview(null);
  }

  const displayUrl = preview || value;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <button
          type="button"
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          disabled={disabled || uploading}
          className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-lg cursor-pointer hover:shadow-xl transition-shadow disabled:opacity-60 disabled:cursor-not-allowed bg-gray-100 dark:bg-neutral-900`}
        >
          {uploading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-neutral-900">
              <Loader2 className={`${iconSize[size]} text-rose-500 animate-spin`} />
            </div>
          ) : displayUrl ? (
            <img
              src={displayUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-neutral-900">
              <User className={`${iconSize[size]} text-gray-400`} />
            </div>
          )}

          {!uploading && !disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}
        </button>

        {displayUrl && !uploading && !disabled && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors"
            aria-label="Remove photo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleFile}
        disabled={disabled || uploading}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        disabled={disabled || uploading}
        className="text-sm font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 disabled:opacity-50"
      >
        {displayUrl ? "Change photo" : "Upload photo"}
      </button>
    </div>
  );
}

export default ProfilePictureUploader;
