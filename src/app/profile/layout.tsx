import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "My Profile — Leish!",
  description: "Manage your Leish! profile and preferences.",
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
