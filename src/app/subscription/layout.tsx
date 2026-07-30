import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Subscription — Leish!",
  description: "Manage your Leish+ subscription plan.",
};

export default function SubscriptionLayout({ children }: { children: ReactNode }) {
  return children;
}
