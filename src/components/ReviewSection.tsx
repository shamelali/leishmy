"use client";

import { useState } from "react";
import { Star, Send, CheckCircle } from "lucide-react";

interface ReviewSectionProps {
  bookingId: number;
  artistId?: string | null;
  studioId?: string | null;
  serviceName: string;
}

export default function ReviewSection({
  bookingId,
  artistId,
  studioId,
  serviceName,
}: ReviewSectionProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          rating,
          comment: comment.trim() || undefined,
          artistId: artistId || undefined,
          studioId: studioId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit review");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          Thank you for your review!
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Your feedback helps others find great {artistId ? "artists" : "studios"}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Leave a Review for {serviceName}
      </h3>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            className="p-0.5"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= (hoveredStar || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            {rating}/5
          </span>
        )}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)..."
        rows={3}
        className="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 text-gray-900 dark:text-white placeholder:text-gray-400"
      />

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium rounded-xl text-sm hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <Send className="w-4 h-4" />
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  );
}
