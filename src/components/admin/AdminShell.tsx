"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { adminNavItems } from "@/lib/admin-nav";

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const activeId =
    adminNavItems.find((item) =>
      item.href === pathname
        ? true
        : item.href !== "/dashboard/admin" && pathname.startsWith(item.href),
    )?.id ?? "overview";

  return (
    <DashboardSidebar items={adminNavItems} activeId={activeId}>
      {children}
    </DashboardSidebar>
  );
}
