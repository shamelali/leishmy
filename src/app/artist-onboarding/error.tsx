"use client";

import ErrorState from "@/components/ErrorState";

export default function ArtistOnboardingError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState {...props} />;
}
