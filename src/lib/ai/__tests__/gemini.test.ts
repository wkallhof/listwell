// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGenerateContent = vi.fn();

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: (...args: unknown[]) => mockGenerateContent(...args),
      };
    },
  };
});

describe("enhanceImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("throws when GEMINI_API_KEY is not set", async () => {
    delete process.env.GEMINI_API_KEY;
    const { enhanceImage } = await import("../gemini");

    await expect(
      enhanceImage("base64data", "image/jpeg", "enhance this"),
    ).rejects.toThrow("GEMINI_API_KEY environment variable is not set");
  });

  it("sends image and prompt to Gemini API", async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: "enhanced-base64-data",
                  mimeType: "image/png",
                },
              },
            ],
          },
        },
      ],
    });

    const { enhanceImage } = await import("../gemini");
    const result = await enhanceImage(
      "original-base64",
      "image/jpeg",
      "improve lighting",
    );

    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: "original-base64" } },
              { text: "improve lighting" },
            ],
          },
        ],
        config: {
          responseModalities: ["image", "text"],
        },
      }),
    );

    expect(result.imageBase64).toBe("enhanced-base64-data");
    expect(result.mimeType).toBe("image/png");
  });

  it("defaults mimeType to image/png when not provided in response", async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: "enhanced-data",
                  mimeType: undefined,
                },
              },
            ],
          },
        },
      ],
    });

    const { enhanceImage } = await import("../gemini");
    const result = await enhanceImage("data", "image/jpeg", "enhance");

    expect(result.mimeType).toBe("image/png");
  });

  it("throws when no candidates are returned", async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [],
    });

    const { enhanceImage } = await import("../gemini");

    await expect(
      enhanceImage("data", "image/jpeg", "enhance"),
    ).rejects.toThrow("No response from Gemini image enhancement");
  });

  it("throws when response has no image data", async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [{ text: "I cannot enhance this image" }],
          },
        },
      ],
    });

    const { enhanceImage } = await import("../gemini");

    await expect(
      enhanceImage("data", "image/jpeg", "enhance"),
    ).rejects.toThrow("Gemini did not return an enhanced image");
  });
});
