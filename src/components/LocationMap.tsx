"use client";

import { MapPin, Navigation, ExternalLink, Clock, Star } from "lucide-react";

interface LocationMapProps {
  name: string;
  address: string;
  area: string;
  rating?: number;
  responseTime?: string;
}

export default function LocationMap({
  name,
  address,
  area,
  rating,
  responseTime,
}: LocationMapProps) {
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${name} ${address} ${area}`)}`;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden">
      <div className="relative h-48 bg-gradient-to-br from-rose-100 via-pink-50 to-purple-50 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800 overflow-hidden">
        <div className="absolute inset-0 opacity-20 dark:opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-gray-400"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-300/30 dark:bg-neutral-600/30" />
          <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-gray-300/30 dark:bg-neutral-600/30" />
          <div className="absolute top-0 bottom-0 right-1/4 w-0.5 bg-gray-300/30 dark:bg-neutral-600/30" />
          <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-gray-300/20 dark:bg-neutral-600/20" />
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
          <div className="relative">
            <div
              className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-300/50 dark:shadow-rose-900/50 animate-bounce"
              style={{ animationDuration: "2s" }}
            >
              <MapPin className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-rose-500 rotate-45" />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-6 h-2 bg-rose-500/20 rounded-full blur-sm" />
          </div>
        </div>

        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-rose-300/30 dark:border-rose-700/30 rounded-full animate-ping"
          style={{ animationDuration: "3s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-rose-200/20 dark:border-rose-800/20 rounded-full" />

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-neutral-700"
        >
          <Navigation className="w-3 h-3 text-rose-500" /> Open Maps
          <ExternalLink className="w-3 h-3" />
        </a>

        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
          📍 {area}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {address}, {area}
            </p>
          </div>
          {rating && (
            <div className="flex items-center gap-1 text-xs">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {rating}
              </span>
            </div>
          )}
        </div>
        {responseTime && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
            <Clock className="w-3 h-3" /> Responds {responseTime}
          </div>
        )}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors border border-rose-200 dark:border-rose-800"
        >
          <MapPin className="w-4 h-4" /> Get Directions
        </a>
      </div>
    </div>
  );
}
