import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Search Makeup Artists & Studios — Leish!",
  description: "Find makeup artists and beauty studios near you. Filter by location, category, and availability.",
};

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children;
}
