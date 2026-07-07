"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function RoleRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;

    if (user.role === "artist") {
      router.replace("/dashboard/artist");
    } else if (user.role === "studio") {
      router.replace("/dashboard/studio");
    }
  }, [user, loading, router]);

  return null;
}
