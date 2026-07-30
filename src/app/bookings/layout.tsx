import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "My Bookings — Leish!",
  description: "View and manage your beauty booking history.",
};

export default function BookingsLayout({ children }: { children: ReactNode }) {
  return children;
}
