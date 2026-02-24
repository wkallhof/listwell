import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "@listwell/db";
import { userPreferences } from "@listwell/db/schema";

export const preferencesRoutes = new Hono();

const VALID_THEMES = ["system", "light", "dark"] as const;

const DEFAULTS = {
  themePreference: "system" as const,
  notificationsEnabled: true,
};

preferencesRoutes.get("/preferences", async (c) => {
  const user = c.get("user");

  const row = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, user.id),
  });

  if (!row) {
    return c.json(DEFAULTS);
  }

  return c.json({
    themePreference: row.themePreference,
    notificationsEnabled: row.notificationsEnabled,
  });
});

preferencesRoutes.patch("/preferences", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const updates: Record<string, unknown> = {};

  if ("themePreference" in body) {
    if (!VALID_THEMES.includes(body.themePreference)) {
      return c.json(
        { error: "themePreference must be one of: system, light, dark" },
        400,
      );
    }
    updates.themePreference = body.themePreference;
  }

  if ("notificationsEnabled" in body) {
    if (typeof body.notificationsEnabled !== "boolean") {
      return c.json({ error: "notificationsEnabled must be a boolean" }, 400);
    }
    updates.notificationsEnabled = body.notificationsEnabled;
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  const existing = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, user.id),
  });

  if (existing) {
    await db
      .update(userPreferences)
      .set(updates)
      .where(eq(userPreferences.userId, user.id));
  } else {
    await db.insert(userPreferences).values({
      userId: user.id,
      ...updates,
    });
  }

  const row = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, user.id),
  });

  return c.json({
    themePreference: row!.themePreference,
    notificationsEnabled: row!.notificationsEnabled,
  });
});
