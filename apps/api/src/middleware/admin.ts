import { createMiddleware } from "hono/factory";

export const requireAdmin = createMiddleware(async (c, next) => {
  const user = c.get("user");

  if (user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
});
