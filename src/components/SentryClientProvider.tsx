"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function SentryClientProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || "",
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: process.env.NODE_ENV || "development",
      enabled: process.env.NODE_ENV === "production" && !!process.env.SENTRY_DSN,
    });
  }, []);

  return <>{children}</>;
}