import webpush from "web-push";
import apn from "@parse/node-apn";
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

// APNs configuration
const APNS_KEY_PATH = process.env.APNS_KEY_PATH;
const APNS_KEY_ID = process.env.APNS_KEY_ID;
const APNS_TEAM_ID = process.env.APNS_TEAM_ID;
const APNS_BUNDLE_ID = process.env.APNS_BUNDLE_ID ?? "com.listwell.app";

let apnProvider: apn.Provider | null = null;

if (APNS_KEY_PATH && APNS_KEY_ID && APNS_TEAM_ID) {
  apnProvider = new apn.Provider({
    token: {
      key: APNS_KEY_PATH,
      keyId: APNS_KEY_ID,
      teamId: APNS_TEAM_ID,
    },
    production: process.env.NODE_ENV === "production",
  });
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

async function sendWebPushNotifications(
  subs: Array<{ id: string; endpoint: string | null; p256dh: string | null; auth: string | null }>,
  payload: NotificationPayload,
): Promise<void> {
  const webSubs = subs.filter((s) => s.endpoint && s.p256dh && s.auth);
  if (webSubs.length === 0) return;

  const payloadStr = JSON.stringify(payload);

  const results = await Promise.allSettled(
    webSubs.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint!,
        keys: {
          p256dh: sub.p256dh!,
          auth: sub.auth!,
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
      `[push] All ${failures.length} web push notifications failed`,
    );
  }
}

async function sendAPNsNotifications(
  subs: Array<{ id: string; deviceToken: string | null }>,
  payload: NotificationPayload,
): Promise<void> {
  if (!apnProvider) return;
  const provider = apnProvider;

  const apnsSubs = subs.filter((s) => s.deviceToken);
  if (apnsSubs.length === 0) return;

  const results = await Promise.allSettled(
    apnsSubs.map(async (sub) => {
      const notification = new apn.Notification();
      notification.alert = {
        title: payload.title,
        body: payload.body,
      };
      notification.sound = "default";
      notification.topic = APNS_BUNDLE_ID;
      notification.payload = payload.data ?? {};

      const result = await provider.send(notification, sub.deviceToken!);

      if (result.failed.length > 0) {
        const failure = result.failed[0];
        if (
          failure.status === 410 ||
          failure.response?.reason === "Unregistered" ||
          failure.response?.reason === "BadDeviceToken"
        ) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id));
        }
        throw new Error(`APNs send failed: ${failure.response?.reason ?? "unknown"}`);
      }
    }),
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0 && failures.length === results.length) {
    console.error(
      `[push] All ${failures.length} APNs notifications failed`,
    );
  }
}

export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload,
): Promise<void> {
  const subscriptions = await db.query.pushSubscriptions.findMany({
    where: eq(pushSubscriptions.userId, userId),
  });

  if (subscriptions.length === 0) return;

  const webSubs = subscriptions.filter((s) => s.type === "web");
  const apnsSubs = subscriptions.filter((s) => s.type === "apns");

  await Promise.allSettled([
    sendWebPushNotifications(webSubs, payload),
    sendAPNsNotifications(apnsSubs, payload),
  ]);
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
    data: { url: `/listings/${listingId}`, listingId },
  });
}
