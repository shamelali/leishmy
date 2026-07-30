import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Inspiration — Leish!",
  description: "Browse makeup looks, styles, and inspiration boards from Malaysia's top beauty artists.",
};

export default function InspirationLayout({ children }: { children: ReactNode }) {
  return children;
}
