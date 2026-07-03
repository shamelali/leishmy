// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || "",

  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,

  enabled:
    process.env.NODE_ENV === "production" && !!process.env.SENTRY_DSN,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
