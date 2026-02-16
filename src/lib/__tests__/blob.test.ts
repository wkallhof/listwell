// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockPut = vi.fn();
const mockDel = vi.fn();

vi.mock("@vercel/blob", () => ({
  put: (...args: unknown[]) => mockPut(...args),
  del: (...args: unknown[]) => mockDel(...args),
}));

import { uploadImage, deleteImage, deleteImages } from "@/lib/blob";

describe("blob helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("uploadImage", () => {
    it("uploads a file and returns url and key", async () => {
      mockPut.mockResolvedValue({
        url: "https://blob.vercel-storage.com/listings/abc/photo.jpg",
        pathname: "listings/abc/photo-xyz.jpg",
      });

      const file = new File(["image data"], "photo.jpg", {
        type: "image/jpeg",
      });
      const result = await uploadImage(file, "abc");

      expect(mockPut).toHaveBeenCalledWith(
        "listings/abc/photo.jpg",
        file,
        { access: "public", addRandomSuffix: true },
      );
      expect(result.url).toBe(
        "https://blob.vercel-storage.com/listings/abc/photo.jpg",
      );
      expect(result.key).toBe("listings/abc/photo-xyz.jpg");
    });
  });

  describe("deleteImage", () => {
    it("deletes a single image by URL", async () => {
      mockDel.mockResolvedValue(undefined);

      await deleteImage("https://blob.vercel-storage.com/photo.jpg");

      expect(mockDel).toHaveBeenCalledWith(
        "https://blob.vercel-storage.com/photo.jpg",
      );
    });
  });

  describe("deleteImages", () => {
    it("deletes multiple images by URL", async () => {
      mockDel.mockResolvedValue(undefined);

      await deleteImages([
        "https://blob.vercel-storage.com/a.jpg",
        "https://blob.vercel-storage.com/b.jpg",
      ]);

      expect(mockDel).toHaveBeenCalledWith([
        "https://blob.vercel-storage.com/a.jpg",
        "https://blob.vercel-storage.com/b.jpg",
      ]);
    });

    it("does nothing for empty array", async () => {
      await deleteImages([]);

      expect(mockDel).not.toHaveBeenCalled();
    });
  });
});
