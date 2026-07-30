import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Forgot Password — Leish!",
  description: "Reset your Leish! account password.",
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
