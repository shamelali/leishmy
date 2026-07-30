import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Studio Dashboard — Leish!",
  description: "Manage your studio inventory, staff, calendar, and finances.",
};

export default function StudioDashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
