"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function PushNotificationToggle() {
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported || loading) return null;

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300"
    >
      {isSubscribed ? (
        <>
          <BellOff className="w-4 h-4 text-rose-500" /> Disable Notifications
        </>
      ) : (
        <>
          <Bell className="w-4 h-4 text-rose-500" /> Enable Notifications
        </>
      )}
    </button>
  );
}
