"use client";

import ErrorState from "@/components/ErrorState";

export default function EventsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState {...props} />;
}