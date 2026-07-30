import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Verify Email — Leish!",
  description: "Verify your email address for your Leish! account.",
};

export default function VerifyEmailLayout({ children }: { children: ReactNode }) {
  return children;
}
