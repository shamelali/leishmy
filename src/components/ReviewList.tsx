"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, User, Clock } from "lucide-react";
import Skeleton from "@/components/Skeleton";

interface Review {
  id: number;
  rating: number;
  text: string | null;
  author: string;
  authorAvatar: string | null;
  service: string | null;
  createdAt: string;
}

interface ReviewListProps {
  artistId: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReviewList({ artistId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reviews?artistId=${artistId}`)
      .then((r) => r.json())
      .then((data) => setReviews(data.reviews || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [artistId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-2xl border border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) return null;

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reviews</h2>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/30 rounded-full">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            {avgRating.toFixed(1)}
          </span>
          <span className="text-xs text-amber-500/70 dark:text-amber-400/70">
            ({reviews.length})
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {review.author}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= review.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-200 dark:text-neutral-700"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              {review.service && (
                <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 shrink-0">
                  {review.service}
                </span>
              )}
            </div>
            {review.text && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {review.text}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
