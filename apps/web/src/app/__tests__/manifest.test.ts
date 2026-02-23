// @vitest-environment node
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("manifest", () => {
  it("returns a valid PWA manifest", () => {
    const result = manifest();

    expect(result.name).toBe("Listwell");
    expect(result.short_name).toBe("Listwell");
    expect(result.display).toBe("standalone");
    expect(result.start_url).toBe("/");
  });

  it("includes brand colors", () => {
    const result = manifest();

    expect(result.background_color).toBe("#F4F1EB");
    expect(result.theme_color).toBe("#259E89");
  });

  it("includes required icon sizes", () => {
    const result = manifest();

    expect(result.icons).toHaveLength(2);
    expect(result.icons?.[0]).toMatchObject({
      src: "/icon-192x192.png",
      sizes: "192x192",
    });
    expect(result.icons?.[1]).toMatchObject({
      src: "/icon-512x512.png",
      sizes: "512x512",
    });
  });
});
