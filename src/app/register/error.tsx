"use client";

import ErrorState from "@/components/ErrorState";

export default function RegisterError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState {...props} />;
}
