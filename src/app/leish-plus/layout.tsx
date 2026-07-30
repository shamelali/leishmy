import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Leish+ Subscription — Leish!",
  description: "Unlock exclusive perks with Leish+ premium subscription.",
};

export default function LeishPlusLayout({ children }: { children: ReactNode }) {
  return children;
}
