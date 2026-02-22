import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "@listwell/db";
import { pushSubscriptions } from "@listwell/db/schema";
export const pushRoutes = new Hono();

interface WebPushBody {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface APNsBody {
  type: "apns";
  deviceToken: string;
}

type SubscribeBody = WebPushBody | APNsBody;

interface UnsubscribeBody {
  endpoint?: string;
  deviceToken?: string;
}

function isAPNsBody(body: SubscribeBody): body is APNsBody {
  return "type" in body && body.type === "apns";
}

pushRoutes.post("/push/subscribe", async (c) => {
  const user = c.get("user");
  const body = (await c.req.json()) as SubscribeBody;

  if (isAPNsBody(body)) {
    if (!body.deviceToken) {
      return c.json({ error: "deviceToken is required" }, 400);
    }

    const existing = await db.query.pushSubscriptions.findFirst({
      where: and(
        eq(pushSubscriptions.userId, user.id),
        eq(pushSubscriptions.deviceToken, body.deviceToken),
      ),
    });

    if (existing) {
      return c.json({ success: true });
    }

    await db.insert(pushSubscriptions).values({
      userId: user.id,
      type: "apns",
      deviceToken: body.deviceToken,
    });

    return c.json({ success: true });
  }

  // Web push flow
  const { endpoint, p256dh, auth: authKey } = body;

  if (!endpoint || !p256dh || !authKey) {
    return c.json({ error: "endpoint, p256dh, and auth are required" }, 400);
  }

  const existing = await db.query.pushSubscriptions.findFirst({
    where: and(
      eq(pushSubscriptions.userId, user.id),
      eq(pushSubscriptions.endpoint, endpoint),
    ),
  });

  if (existing) {
    await db
      .update(pushSubscriptions)
      .set({ p256dh, auth: authKey })
      .where(eq(pushSubscriptions.id, existing.id));
    return c.json({ success: true });
  }

  await db.insert(pushSubscriptions).values({
    userId: user.id,
    type: "web",
    endpoint,
    p256dh,
    auth: authKey,
  });

  return c.json({ success: true });
});

pushRoutes.delete("/push/subscribe", async (c) => {
  const user = c.get("user");
  const body = (await c.req.json()) as UnsubscribeBody;

  if (body.deviceToken) {
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, user.id),
          eq(pushSubscriptions.deviceToken, body.deviceToken),
        ),
      );
    return c.json({ success: true });
  }

  if (!body.endpoint) {
    return c.json({ error: "endpoint or deviceToken is required" }, 400);
  }

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, user.id),
        eq(pushSubscriptions.endpoint, body.endpoint),
      ),
    );

  return c.json({ success: true });
});
