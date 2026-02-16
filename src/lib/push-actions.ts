"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function subscribePush(
  input: PushSubscriptionInput,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if this endpoint already exists for this user
  const existing = await db.query.pushSubscriptions.findFirst({
    where: and(
      eq(pushSubscriptions.userId, session.user.id),
      eq(pushSubscriptions.endpoint, input.endpoint),
    ),
  });

  if (existing) {
    // Update existing subscription keys
    await db
      .update(pushSubscriptions)
      .set({ p256dh: input.p256dh, auth: input.auth })
      .where(eq(pushSubscriptions.id, existing.id));
    return { success: true };
  }

  await db.insert(pushSubscriptions).values({
    userId: session.user.id,
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
  });

  return { success: true };
}

export async function unsubscribePush(
  endpoint: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  await db
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, session.user.id),
        eq(pushSubscriptions.endpoint, endpoint),
      ),
    );

  return { success: true };
}
