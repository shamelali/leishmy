"use client";

import ErrorState from "@/components/ErrorState";

export default function StaffError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState {...props} />;
}
