"use client";

import ErrorState from "@/components/ErrorState";

export default function ReportsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState {...props} />;
}
