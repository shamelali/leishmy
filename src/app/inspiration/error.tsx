"use client";

import ErrorState from "@/components/ErrorState";

export default function InspirationError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState {...props} />;
}