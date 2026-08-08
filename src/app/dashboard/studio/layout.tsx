import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/server";
import { hasPermission, StudioRole } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Studio Dashboard — Leish!",
  description: "Manage your studio inventory, staff, calendar, and finances.",
};

export const dynamic = "force-dynamic";

export default async function StudioDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  
  // Check if user has a studio role (artist or studio)
  const isStudioUser = session.role === "artist" || session.role === "studio";
  if (!isStudioUser) redirect("/");
  
  // We could optionally store the studio role in a context or pass it down
  // For now, the individual pages will check permissions as needed
  
  return children;
}