import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Get Started — Leish!",
  description: "Set up your Leish! profile and preferences.",
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return children;
}
