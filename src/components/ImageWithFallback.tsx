"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { isCloudinaryUrl } from "@/lib/cloudinary-client";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackColor?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  sizes?: string;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

function withCloudinaryTransform(
  src: string,
  width?: number,
  height?: number,
  aspectRatio?: string,
): string {
  if (
    !CLOUD_NAME ||
    !isCloudinaryUrl(src) ||
    (src.includes("/upload/") && !src.split("/upload/")[1].includes(","))
  ) {
    const trans: string[] = ["f_auto", "q_auto"];
    if (width) trans.push(`w_${width}`);
    if (height) trans.push(`h_${height}`);
    if (aspectRatio) trans.push(`ar_${aspectRatio}`);
    if (width || height) trans.push("c_fill");
    if (trans.length <= 2) return src;
    const parts = src.split("/upload/");
    return `${parts[0]}/upload/${trans.join(",")}/${parts[1]}`;
  }
  return src;
}

/**
 * Strip any existing Cloudinary transformation so we can retry with the
 * bare delivery URL. If the original URL is `.../upload/f_auto,q_auto/v123/abc.png`
 * this returns `.../upload/v123/abc.png`. Non-Cloudinary URLs pass through.
 *
 * Used as the second-stage fallback in ImageWithFallback: if a stored URL
 * has a transform that Cloudinary now rejects (e.g. corrupt source, format
 * drift), we retry without the transform before giving up.
 */
function stripCloudinaryTransform(src: string): string {
  if (!isCloudinaryUrl(src)) return src;
  const parts = src.split("/upload/");
  if (parts.length !== 2) return src;
  const tail = parts[1];
  // The first segment after /upload/ is the transformation (contains
  // commas) when present. If it doesn't contain a comma, there's no
  // transform to strip.
  const firstSlash = tail.indexOf("/");
  if (firstSlash < 0) return src;
  const first = tail.slice(0, firstSlash);
  if (!first.includes(",")) return src;
  const rest = tail.slice(firstSlash + 1);
  return `${parts[0]}/upload/${rest}`;
}

export default function ImageWithFallback({
  src,
  alt,
  className = "",
  fallbackColor = "bg-gradient-to-br from-rose-100 to-pink-100 dark:from-neutral-800 dark:to-neutral-700",
  width,
  height,
  aspectRatio,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: ImageWithFallbackProps) {
  // Two-stage fallback: try the transformed URL first; if Cloudinary
  // rejects the transform (e.g. unsupported format, broken original),
  // fall back to the untransformed URL. Only if THAT also fails do we
  // show the gradient placeholder.
  const [errorStage, setErrorStage] = useState<0 | 1 | 2>(0);

  const optimizedSrc = useMemo(
    () => withCloudinaryTransform(src, width, height, aspectRatio),
    [src, width, height, aspectRatio],
  );

  const activeSrc =
    errorStage === 1 ? stripCloudinaryTransform(src) : optimizedSrc;

  return (
    <div className={`relative ${className}`}>
      {errorStage === 2 ? (
        <div
          className={`${fallbackColor} w-full h-full flex items-center justify-center`}
        >
          <svg
            className="w-8 h-8 text-rose-300 dark:text-neutral-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
        </div>
      ) : (
        <Image
          src={activeSrc}
          alt={alt}
          fill
          className="object-cover"
          onError={() => {
            setErrorStage((s) => (s === 0 ? 1 : 2) as 0 | 1 | 2);
          }}
          loading="lazy"
          unoptimized
          sizes={sizes}
        />
      )}
    </div>
  );
}
