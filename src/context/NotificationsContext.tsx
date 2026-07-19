"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";

export interface Notification {
  id: string;
  type:
    | "booking_confirmed"
    | "booking_cancelled"
    | "booking_reminder"
    | "review_request"
    | "new_artist"
    | "welcome";
  title: string;
  message: string;
  read: boolean;
  date: string;
  link?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unread: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    try {
      const saved = localStorage.getItem("leish-notifications");
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
      // If localStorage is empty, start with an empty list. The DB fetch
      // below populates real notifications if any exist. Previously this
      // seeded three fake demo notifications (Welcome / Aiko Nakamura /
      // Leave a review) that looked real to users but pointed at fake
      // or 404 links — misleading and embarrassing. Seed removed.
    } catch {}
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(
          "leish-notifications",
          JSON.stringify(notifications),
        );
      } catch {}
    }
  }, [notifications, mounted]);

  const unread = notifications.filter((n) => !n.read).length;

  const fetchFromServer = useCallback(async (signal?: AbortSignal) => {
    if (!user?.id) return;
    try {
      const res = await fetch(
        `/api/user/notifications`,
        { signal },
      );
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.notifications || []).map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.body,
          read: !!n.readAt,
          date: n.date,
          link: n.data?.link,
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      console.error("Failed to fetch notifications");
    }
  }, [user]);

  const syncToServer = useCallback(
    async (
      action: "mark-read" | "mark-all-read" | "delete" | "clear-all",
      id?: string,
      signal?: AbortSignal,
    ) => {
      if (!user?.id) return;
      try {
        await fetch(`/api/user/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, notificationId: id }),
          signal,
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Failed to sync notification");
      }
    },
    [user],
  );

  useEffect(() => {
    if (mounted && user?.id) {
      const controller = new AbortController();
      /* eslint-disable react-hooks/set-state-in-effect */
      fetchFromServer(controller.signal);
      /* eslint-enable react-hooks/set-state-in-effect */
      return () => controller.abort();
    }
  }, [mounted, user?.id, fetchFromServer]);

  const markRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      syncToServer("mark-read", id);
    },
    [syncToServer],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    syncToServer("mark-all-read");
  }, [syncToServer]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    syncToServer("clear-all");
  }, [syncToServer]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unread,
        markRead,
        markAllRead,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    return {
      notifications: [] as Notification[],
      unread: 0,
      markRead: (_id: string) => {},
      markAllRead: () => {},
      clearAll: () => {},
    };
  }
  return ctx;
}
