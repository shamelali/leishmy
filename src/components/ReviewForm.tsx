"use client";

import { useState } from "react";
import { Star, Send, MessageSquare } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface ReviewFormProps {
  artistId: string;
  artistName: string;
  services: { id: string; name: string }[];
  onSubmitted?: () => void;
}

export default function ReviewForm({
  artistId,
  artistName,
  services,
  onSubmitted,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [service, setService] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-5 text-center animate-scale-in">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Star className="w-6 h-6 text-green-600 dark:text-green-400 fill-green-600 dark:fill-green-400" />
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
          Thank you for your review!
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your feedback helps other clients find great artists.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.info("Please select a star rating");
      return;
    }
    if (text.trim().length < 10) {
      toast.info("Please write at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId,
          author: "You",
          rating,
          text: text.trim(),
          service: service || undefined,
        }),
      });
      toast.success("Review submitted!");
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-rose-500" />
        <h3 className="font-bold text-gray-900 dark:text-white">
          Write a Review
        </h3>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Rating <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`w-7 h-7 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-200 dark:text-neutral-700"
                }`}
              />
            </button>
          ))}
          {(hoverRating || rating) > 0 && (
            <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              {ratingLabels[hoverRating || rating]}
            </span>
          )}
        </div>
        {rating === 0 && hoverRating === 0 && (
          <p className="text-xs text-gray-400 mt-1">Click a star to rate</p>
        )}
      </div>

      {services.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Service (optional)
          </label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
          >
            <option value="">Select a service...</option>
            {services.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Review <span className="text-red-400">*</span>
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={`Share your experience with ${artistName}...`}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-400">
            {text.length < 10
              ? `${10 - text.length} more characters needed`
              : "Minimum reached"}
          </p>
          <p className="text-xs text-gray-400">{text.length}/500</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || rating === 0 || text.trim().length < 10}
        className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Submit Review
          </>
        )}
      </button>
    </form>
  );
}
