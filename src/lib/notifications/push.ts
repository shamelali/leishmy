import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  try {
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
