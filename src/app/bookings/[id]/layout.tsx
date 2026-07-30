import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Booking Details — Leish!",
  description: "View your appointment details, status, and artist info.",
};

export default function BookingDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
