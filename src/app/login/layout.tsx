import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign In — Leish!",
  description: "Sign in to your Leish! account to manage bookings, favorites, and more.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
