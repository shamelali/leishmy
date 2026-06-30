import "@/lib/env";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ThemeScript } from "@/components/ThemeScript";

export const metadata: Metadata = {
  title: { default: "Leish! — Beauty Booking Marketplace", template: "%s | Leish!" },
  description:
    "Book Beauty. Anywhere. Discover makeup artists and studios across Malaysia, view real-time availability, and secure your booking in minutes.",
  keywords: ["makeup artist", "beauty booking", "Malaysia", "bridal makeup", "hijab makeup", "studio booking"],
  metadataBase: new URL("https://leishmy.vercel.app"),
  openGraph: {
    title: "Leish! — Beauty Booking Marketplace",
    description: "Book Beauty. Anywhere. Discover makeup artists and studios across Malaysia.",
    url: "https://leishmy.vercel.app",
    siteName: "Leish!",
    locale: "en_MY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leish! — Beauty Booking Marketplace",
    description: "Book Beauty. Anywhere. Discover makeup artists and studios across Malaysia.",
  },
  robots: { index: true, follow: true },
};

import Providers from "@/components/Providers";
import BackToTop from "@/components/BackToTop";
import AccessibilityMenu from "@/components/AccessibilityMenu";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-16">{children}</main>
          <Footer />
          <BackToTop />
          <AccessibilityMenu />
        </Providers>
      </body>
    </html>
  );
}
