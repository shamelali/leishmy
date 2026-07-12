"use client";

import { AuthProvider } from "@/context/AuthContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { ToastProvider } from "@/context/ToastContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import SentryClientProvider from "@/components/SentryClientProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <ToastProvider>
          <NotificationsProvider>
            <SentryClientProvider>
              {children}
            </SentryClientProvider>
          </NotificationsProvider>
        </ToastProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}