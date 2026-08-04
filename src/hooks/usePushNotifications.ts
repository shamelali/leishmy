"use client";

import { useCallback, useSyncExternalStore } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const isSupported =
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

type Listener = () => void;
let cachedSubscription: boolean | null = null;
let listeners: Listener[] = [];

function subscribePush(listener: Listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange() {
  for (const l of listeners) l();
}

function getSnapshot(): boolean {
  return cachedSubscription ?? false;
}

function getServerSnapshot(): boolean {
  return false;
}

async function refreshSubscriptionState() {
  if (!isSupported) {
    cachedSubscription = false;
    emitChange();
    return;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    cachedSubscription = !!sub;
  } catch {
    cachedSubscription = false;
  }
  emitChange();
}

// Kick off the initial check once
if (isSupported && cachedSubscription === null) {
  cachedSubscription = false;
  navigator.serviceWorker.ready.then((reg) => {
    reg.pushManager.getSubscription().then((sub) => {
      cachedSubscription = !!sub;
      emitChange();
    });
  });
}

export function usePushNotifications() {
  const isSubscribed = useSyncExternalStore(
    subscribePush,
    getSnapshot,
    getServerSnapshot,
  );

  const subscribe = useCallback(async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey || !isSupported) return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (res.ok) {
        cachedSubscription = true;
        emitChange();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Push subscribe error:", err);
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
        cachedSubscription = false;
        emitChange();
      }
    } catch (err) {
      console.error("Push unsubscribe error:", err);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    loading: cachedSubscription === null,
    subscribe,
    unsubscribe,
  };
}
