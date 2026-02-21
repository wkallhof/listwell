import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db } from "@listwell/db";
import { pushSubscriptions } from "@listwell/db/schema";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const APP_URL = process.env.WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:admin@${new URL(APP_URL).hostname}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
}

interface WebPushError {
  statusCode: number;
}

function isWebPushError(error: unknown): error is WebPushError {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as WebPushError).statusCode === "number"
  );
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload,
): Promise<void> {
  const subscriptions = await db.query.pushSubscriptions.findMany({
    where: eq(pushSubscriptions.userId, userId),
  });

  if (subscriptions.length === 0) return;

  const payloadStr = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSub, payloadStr);
      } catch (error: unknown) {
        if (isWebPushError(error) && (error.statusCode === 404 || error.statusCode === 410)) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        }
        throw error;
      }
    }),
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0 && failures.length === results.length) {
    console.error(
      `[push] All ${failures.length} notifications failed for user ${userId}`,
    );
  }
}

export async function sendListingReadyNotification(
  userId: string,
  listingId: string,
  title: string,
): Promise<void> {
  await sendPushNotification(userId, {
    title: "Listing Ready!",
    body: title || "Your listing has been generated",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    data: { url: `/listings/${listingId}` },
  });
}
