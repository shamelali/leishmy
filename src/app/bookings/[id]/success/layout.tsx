import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Booking Confirmed — Leish!",
  description: "Your appointment has been booked successfully.",
};

export default function BookingSuccessLayout({ children }: { children: ReactNode }) {
  return children;
}
