import { createMiddleware } from "hono/factory";
import { auth } from "../auth";

interface SessionUser {
  id: string;
  email: string;
  name: string;
}

declare module "hono" {
  interface ContextVariableMap {
    user: SessionUser;
  }
}

export const requireAuth = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", session.user as SessionUser);
  await next();
});
