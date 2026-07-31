"use client";

import { useState } from "react";
import SaveToBoard from "@/components/SaveToBoard";
import ImageLightbox from "@/components/ImageLightbox";

interface PortfolioGridProps {
  images: string[];
  artistId: string;
  artistName: string;
}

export default function PortfolioGrid({ images, artistId, artistName }: PortfolioGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((img, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden aspect-square group relative cursor-pointer"
            onClick={() => setLightboxIndex(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={`${artistName} portfolio ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            <SaveToBoard imageUrl={img} artistId={artistId} artistName={artistName} />
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          alt={artistName}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
