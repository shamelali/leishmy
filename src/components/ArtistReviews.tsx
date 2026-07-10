"use client";

import { useState } from "react";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";

interface Service {
  id: string;
  name: string;
}

interface ArtistReviewsProps {
  artistId: string;
  artistName: string;
  services: Service[];
}

export default function ArtistReviews({ artistId, artistName, services }: ArtistReviewsProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <section className="mb-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ReviewList key={refreshKey} artistId={artistId} />
        </div>
        <div>
          <ReviewForm
            artistId={artistId}
            artistName={artistName}
            services={services}
            onSubmitted={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      </div>
    </section>
  );
}
