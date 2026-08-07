import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Artist Dashboard — Leish!",
  description: "Manage your bookings, services, portfolio, and analytics.",
};

export const dynamic = "force-dynamic";

export default async function ArtistDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getAuthSession();
  if (!session) redirect("/login");
  if (session.role !== "artist") redirect("/");

  return children;
}