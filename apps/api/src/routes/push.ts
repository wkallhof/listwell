import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "@listwell/db";
import { pushSubscriptions } from "@listwell/db/schema";
import { requireAuth } from "../middleware/auth";

export const pushRoutes = new Hono();

pushRoutes.use(requireAuth);

pushRoutes.post("/push/subscribe", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const { endpoint, p256dh, auth: authKey } = body as {
    endpoint: string;
    p256dh: string;
    auth: string;
  };

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
    endpoint,
    p256dh,
    auth: authKey,
  });

  return c.json({ success: true });
});

pushRoutes.delete("/push/subscribe", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { endpoint } = body as { endpoint: string };

  if (!endpoint) {
    return c.json({ error: "endpoint is required" }, 400);
  }

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, user.id),
        eq(pushSubscriptions.endpoint, endpoint),
      ),
    );

  return c.json({ success: true });
});
