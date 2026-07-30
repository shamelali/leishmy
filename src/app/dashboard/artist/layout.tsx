import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Artist Dashboard — Leish!",
  description: "Manage your bookings, services, portfolio, and analytics.",
};

export default function ArtistDashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
