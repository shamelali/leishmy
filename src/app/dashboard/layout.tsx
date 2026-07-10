"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  let allowedRoles: string[] | undefined;
  if (pathname?.startsWith("/dashboard/admin")) {
    allowedRoles = ["admin"];
  } else if (pathname?.startsWith("/dashboard/artist")) {
    allowedRoles = ["artist"];
  } else if (pathname?.startsWith("/dashboard/studio")) {
    allowedRoles = ["studio"];
  }

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950">
        {children}
      </div>
    </ProtectedRoute>
  );
}
