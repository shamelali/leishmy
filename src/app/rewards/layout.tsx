import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Rewards — Leish!",
  description: "Track your loyalty points and redeem rewards.",
};

export default function RewardsLayout({ children }: { children: ReactNode }) {
  return children;
}
