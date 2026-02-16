// @vitest-environment node
import { describe, expect, it } from "vitest";

describe("RootLayout", () => {
  it("exports viewport with cover viewport-fit", async () => {
    const mod = await import("@/app/layout");
    expect(mod.viewport).toBeDefined();
    expect(mod.viewport.viewportFit).toBe("cover");
    expect(mod.viewport.themeColor).toBe("#279E89");
  });

  it("exports metadata with apple web app config", async () => {
    const mod = await import("@/app/layout");
    expect(mod.metadata).toBeDefined();
    expect(mod.metadata.title).toBe("Listwell");
    expect(mod.metadata.appleWebApp).toMatchObject({
      capable: true,
      statusBarStyle: "black-translucent",
    });
  });

  it("exports a default layout function", async () => {
    const mod = await import("@/app/layout");
    expect(typeof mod.default).toBe("function");
  });
});
