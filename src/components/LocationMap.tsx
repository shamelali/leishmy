"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

const MapInner = dynamic(() => import("./MapInner"), { ssr: false });

interface LocationMapProps {
  location: string;
  lat?: number;
  lng?: number;
}

const MALAYSIA_CENTER: [number, number] = [4.2105, 101.9778];

export default function LocationMap({ location, lat, lng }: LocationMapProps) {
  const initialPosition =
    (lat && lng ? [lat, lng] : MALAYSIA_CENTER) as [number, number];
  const [position, setPosition] = useState<[number, number]>(initialPosition);
  const [ready, setReady] = useState(!!(lat && lng) || !location);
  const geocoded = useRef(false);

  useEffect(() => {
    if (lat && lng || !location) return;

    if (!geocoded.current) {
      geocoded.current = true;
      fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`,
        {
          headers: { "User-Agent": "leish.my/1.0 (contact@leish.my)" },
        },
      )
        .then((res) => res.json())
        .then((data: Array<{ lat: string; lon: string }>) => {
          if (data?.length > 0) {
            setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          }
        })
        .catch(() => {
          setPosition(MALAYSIA_CENTER);
        })
        .finally(() => setReady(true));
    }
  }, [location, lat, lng]);

  if (!ready) {
    return (
      <div className="h-48 w-full rounded-xl bg-gray-100 dark:bg-neutral-800 animate-pulse flex items-center justify-center">
        <span className="text-xs text-gray-400">Loading map…</span>
      </div>
    );
  }

  return (
    <div className="h-48 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700">
      <MapInner position={position} location={location} />
    </div>
  );
}
