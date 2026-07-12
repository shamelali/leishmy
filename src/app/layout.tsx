import "@/lib/env";
import "@/instrumentation-client";
import * as Sentry from "@sentry/nextjs";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeScript } from "@/components/ThemeScript";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: { default: t("defaultTitle"), template: `%s | ${t("brand")}` },
    description: t("defaultDescription"),
    keywords: ["makeup artist", "beauty booking", "Malaysia", "bridal makeup", "hijab makeup", "studio booking"],
    metadataBase: new URL("https://leish.my"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: "https://leish.my",
      siteName: "Leish!",
      locale: "en_MY",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("twitterTitle"),
      description: t("twitterDescription"),
    },
    robots: { index: true, follow: true },
  };
}

import Providers from "@/components/Providers";
import ErrorState from "@/components/ErrorState";
import BackToTop from "@/components/BackToTop";
import AccessibilityMenu from "@/components/AccessibilityMenu";
import Script from "next/script";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="manifest" href="/manifest.json" />
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Sentry.ErrorBoundary
            fallback={({ error, resetError }) => (
              <ErrorState error={error as Error & { digest?: string }} reset={resetError} />
            )}
          >
            <Providers>
              <Navbar />
              <main className="min-h-screen pt-16">{children}</main>
              <Footer />
              <BackToTop />
              <AccessibilityMenu />
            </Providers>
          </Sentry.ErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
