import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Payments — Leish!",
  description: "View your payment history and receipts.",
};

export default function PaymentsLayout({ children }: { children: ReactNode }) {
  return children;
}
