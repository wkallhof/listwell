import { Hono } from "hono";

export const meRoutes = new Hono();

meRoutes.get("/me", async (c) => {
  const user = c.get("user");

  return c.json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
});
