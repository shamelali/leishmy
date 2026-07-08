"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { extractPublicId, isCloudinaryUrl } from "@/lib/cloudinary-client";
import { cldImage } from "@/lib/cloudinary-url-gen";

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
  // Three-stage fallback:
  //   stage 0: transformed URL (f_auto/q_auto + w/h via url-gen)
  //   stage 1: bare secure_url (no transforms — works around rejects)
  //   stage 2: gradient placeholder
  const [errorStage, setErrorStage] = useState<0 | 1 | 2>(0);

  const optimizedSrc = useMemo(() => {
    if (!isCloudinaryUrl(src)) return src;
    const publicId = extractPublicId(src);
    if (!publicId) return src;
    return cldImage(publicId, { width, height, aspectRatio });
  }, [src, width, height, aspectRatio]);

  // Stage-1 fallback strips any inline transform and tries the bare URL.
  // We approximate "bare" by rebuilding with no resize/quality options.
  const strippedSrc = useMemo(() => {
    if (!isCloudinaryUrl(src)) return src;
    const publicId = extractPublicId(src);
    if (!publicId) return src;
    return cldImage(publicId);
  }, [src]);

  const activeSrc = errorStage === 1 ? strippedSrc : optimizedSrc;

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
