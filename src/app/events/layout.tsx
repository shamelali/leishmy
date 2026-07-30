import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Beauty Events — Leish!",
  description: "Discover beauty events, workshops, and promotions from Malaysia's top makeup artists and studios.",
};

export default function EventsLayout({ children }: { children: ReactNode }) {
  return children;
}
