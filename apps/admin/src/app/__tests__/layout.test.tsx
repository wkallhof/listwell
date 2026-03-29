// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Instrument_Sans: () => ({ variable: "--font-instrument-sans" }),
  JetBrains_Mono: () => ({ variable: "--font-jetbrains-mono" }),
}));

describe("RootLayout", () => {
  it("exports viewport config", async () => {
    const mod = await import("@/app/layout");
    expect(mod.viewport).toBeDefined();
    expect(mod.viewport.width).toBe("device-width");
  });

  it("exports metadata for admin dashboard", async () => {
    const mod = await import("@/app/layout");
    expect(mod.metadata).toBeDefined();
    expect(mod.metadata.title).toBe("Listwell Admin");
  });

  it("exports a default layout function", async () => {
    const mod = await import("@/app/layout");
    expect(typeof mod.default).toBe("function");
  });
});
