// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Fraunces: () => ({ variable: "--font-fraunces" }),
  Instrument_Sans: () => ({ variable: "--font-instrument-sans" }),
  JetBrains_Mono: () => ({ variable: "--font-jetbrains-mono" }),
}));

describe("RootLayout", () => {
  it("exports viewport with cover viewport-fit", async () => {
    const mod = await import("@/app/layout");
    expect(mod.viewport).toBeDefined();
    expect(mod.viewport.viewportFit).toBe("cover");
    expect(mod.viewport.themeColor).toBe("#259E89");
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
