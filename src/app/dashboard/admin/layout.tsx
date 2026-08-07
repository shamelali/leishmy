import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/server";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin Dashboard — Leish!",
  description: "Platform administration, moderation, reports, and settings.",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (session.role !== "admin" && !session.isAdmin) redirect("/");

  return <AdminShell>{children}</AdminShell>;
}
