"use client";

import ErrorState from "@/components/ErrorState";

export default function ContactError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState {...props} />;
}
