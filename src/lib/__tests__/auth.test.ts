// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

// Mock the db module before importing auth
vi.mock("@/db", () => ({
  db: {},
}));

describe("auth", () => {
  it("creates a betterAuth instance", async () => {
    const { auth } = await import("@/lib/auth");
    expect(auth).toBeDefined();
    expect(auth.api).toBeDefined();
  });

  it("has email and password enabled", async () => {
    const { auth } = await import("@/lib/auth");
    expect(auth.api.signInEmail).toBeDefined();
    expect(auth.api.signUpEmail).toBeDefined();
  });

  it("has session management", async () => {
    const { auth } = await import("@/lib/auth");
    expect(auth.api.getSession).toBeDefined();
    expect(auth.api.signOut).toBeDefined();
  });
});

describe("auth-client", () => {
  it("creates an auth client", async () => {
    const { authClient } = await import("@/lib/auth-client");
    expect(authClient).toBeDefined();
    expect(authClient.signIn).toBeDefined();
    expect(authClient.signUp).toBeDefined();
    expect(authClient.signOut).toBeDefined();
    expect(authClient.useSession).toBeDefined();
  });
});
