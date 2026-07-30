import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Artist Onboarding — Leish!",
  description: "Join Leish! as a makeup artist — set up your portfolio and services.",
};

export default function ArtistOnboardingLayout({ children }: { children: ReactNode }) {
  return children;
}
