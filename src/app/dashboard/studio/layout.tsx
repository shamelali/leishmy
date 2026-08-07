import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Studio Dashboard — Leish!",
  description: "Manage your studio inventory, staff, calendar, and finances.",
};

export default async function StudioDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (session.role !== "studio") redirect("/");

  return children;
}