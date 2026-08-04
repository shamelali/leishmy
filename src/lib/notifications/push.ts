import { db } from "@/db";
import { notificationPreferences, pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  kind?: "booking" | "message" | "promo";
}

function isWithinQuietHours(start: string | null, end: string | null): boolean {
  if (!start || !end || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    return false;
  }

  const minutes = (value: string) => {
    const [hours, mins] = value.split(":").map(Number);
    return hours * 60 + mins;
  };
  const startMinutes = minutes(start);
  const endMinutes = minutes(end);
  if (startMinutes === endMinutes) return false;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  const nowMinutes = hour * 60 + minute;

  return startMinutes < endMinutes
    ? nowMinutes >= startMinutes && nowMinutes < endMinutes
    : nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  try {
    const [preferences] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (preferences) {
      const typeEnabled = payload.kind === "message"
        ? preferences.messageNotifications
        : payload.kind === "promo"
          ? preferences.promoNotifications
          : preferences.bookingNotifications;
      if (!preferences.pushEnabled || !typeEnabled || isWithinQuietHours(preferences.quietHoursStart, preferences.quietHoursEnd)) {
        return;
      }
    }

    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) return;

    const webpush = await import("web-push").then((m) => m.default);

    webpush.setVapidDetails(
      "mailto:hello@leish.my",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY,
    );

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.authKey },
            },
            notificationPayload,
          );
        } catch (err: unknown) {
          // Remove expired/invalid subscriptions
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, sub.id));
          }
          throw err;
        }
      }),
    );

    return results;
  } catch (error) {
    console.error("Push notification error:", error);
  }
}
