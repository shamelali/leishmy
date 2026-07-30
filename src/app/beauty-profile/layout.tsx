import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Beauty Profile — Leish!",
  description: "Personalize your beauty profile — skin type, preferences, and more.",
};

export default function BeautyProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
