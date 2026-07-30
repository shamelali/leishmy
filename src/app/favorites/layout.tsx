import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "My Favorites — Leish!",
  description: "Your saved makeup artists and studios.",
};

export default function FavoritesLayout({ children }: { children: ReactNode }) {
  return children;
}
