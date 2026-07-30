import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Create Account — Leish!",
  description: "Create your Leish! account and start booking Malaysia's top makeup artists and beauty studios.",
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
