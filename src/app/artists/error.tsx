"use client";

import ErrorState from "@/components/ErrorState";

export default function ArtistsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState {...props} />;
}
