"use client";

import ErrorState from "@/components/ErrorState";

export default function ArtistBookingsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState {...props} />;
}
