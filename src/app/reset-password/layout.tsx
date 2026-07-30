import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Reset Password — Leish!",
  description: "Set a new password for your Leish! account.",
};

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
