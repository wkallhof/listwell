// @vitest-environment node
import { describe, expect, it } from "vitest";
import { inngest } from "@/inngest/client";

describe("Inngest client", () => {
  it("initializes with correct app id", () => {
    expect(inngest).toBeDefined();
    expect(inngest.id).toBe("listwell");
  });

  it("has send method for triggering events", () => {
    expect(typeof inngest.send).toBe("function");
  });

  it("has createFunction method for defining functions", () => {
    expect(typeof inngest.createFunction).toBe("function");
  });
});
