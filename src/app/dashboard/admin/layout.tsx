import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin Dashboard — Leish!",
  description: "Platform administration, moderation, reports, and settings.",
};

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
