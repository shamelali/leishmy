"use client";

import ErrorState from "@/components/ErrorState";

export default function LoginError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState {...props} />;
}
