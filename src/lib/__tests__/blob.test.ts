// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";

// --- Vercel Blob mocks ---
const mockPut = vi.fn();
const mockDel = vi.fn();

vi.mock("@vercel/blob", () => ({
  put: (...args: unknown[]) => mockPut(...args),
  del: (...args: unknown[]) => mockDel(...args),
}));

// --- AWS S3 mocks ---
const mockSend = vi.fn();
const mockGetSignedUrl = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  class MockS3Client {
    send = mockSend;
  }
  class MockPutObjectCommand {
    _type = "PutObject";
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  }
  class MockDeleteObjectCommand {
    _type = "DeleteObject";
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  }
  class MockDeleteObjectsCommand {
    _type = "DeleteObjects";
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  }
  return {
    S3Client: MockS3Client,
    PutObjectCommand: MockPutObjectCommand,
    DeleteObjectCommand: MockDeleteObjectCommand,
    DeleteObjectsCommand: MockDeleteObjectsCommand,
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

import {
  uploadImage,
  uploadBuffer,
  deleteImage,
  deleteImages,
  createPresignedUploadUrl,
  _resetProviderCache,
} from "@/lib/blob";

describe("blob helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetProviderCache();
    delete process.env.STORAGE_PROVIDER;
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.R2_PUBLIC_URL;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
  });

  describe("Vercel Blob provider (default)", () => {
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
          { access: "public", contentType: undefined, addRandomSuffix: true },
        );
        expect(result.url).toBe(
          "https://blob.vercel-storage.com/listings/abc/photo.jpg",
        );
        expect(result.key).toBe("listings/abc/photo-xyz.jpg");
      });
    });

    describe("uploadBuffer", () => {
      it("uploads a buffer with content type and returns url and key", async () => {
        mockPut.mockResolvedValue({
          url: "https://blob.vercel-storage.com/listings/abc/enhanced.jpg",
          pathname: "listings/abc/enhanced-xyz.jpg",
        });

        const buffer = Buffer.from("image data");
        const result = await uploadBuffer(
          buffer,
          "listings/abc/enhanced.jpg",
          "image/jpeg",
        );

        expect(mockPut).toHaveBeenCalledWith(
          "listings/abc/enhanced.jpg",
          buffer,
          { access: "public", contentType: "image/jpeg", addRandomSuffix: true },
        );
        expect(result.url).toBe(
          "https://blob.vercel-storage.com/listings/abc/enhanced.jpg",
        );
        expect(result.key).toBe("listings/abc/enhanced-xyz.jpg");
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

  describe("R2 provider", () => {
    beforeEach(() => {
      process.env.STORAGE_PROVIDER = "r2";
      process.env.CLOUDFLARE_ACCOUNT_ID = "test-account";
      process.env.R2_BUCKET_NAME = "test-bucket";
      process.env.R2_PUBLIC_URL = "https://pub-test.r2.dev";
      process.env.R2_ACCESS_KEY_ID = "test-key";
      process.env.R2_SECRET_ACCESS_KEY = "test-secret";
    });

    it("throws when R2 env vars are missing", async () => {
      _resetProviderCache();
      delete process.env.CLOUDFLARE_ACCOUNT_ID;

      await expect(
        uploadImage(new File([""], "test.jpg"), "abc"),
      ).rejects.toThrow("Missing R2 configuration");
    });

    describe("uploadImage", () => {
      it("uploads a file to R2 and returns url and key", async () => {
        mockSend.mockResolvedValue({});

        const file = new File(["image data"], "photo.jpg", {
          type: "image/jpeg",
        });
        const result = await uploadImage(file, "abc");

        expect(mockSend).toHaveBeenCalledTimes(1);
        const command = mockSend.mock.calls[0][0];
        expect(command._type).toBe("PutObject");
        expect(command.input.Bucket).toBe("test-bucket");
        expect(command.input.Key).toMatch(/^listings\/abc\/photo-[a-f0-9]+\.jpg$/);
        expect(result.url).toMatch(
          /^https:\/\/pub-test\.r2\.dev\/listings\/abc\/photo-[a-f0-9]+\.jpg$/,
        );
        expect(result.key).toMatch(/^listings\/abc\/photo-[a-f0-9]+\.jpg$/);
      });
    });

    describe("uploadBuffer", () => {
      it("uploads a buffer to R2", async () => {
        mockSend.mockResolvedValue({});

        const buffer = Buffer.from("enhanced image data");
        const result = await uploadBuffer(
          buffer,
          "listings/abc/enhanced.png",
          "image/png",
        );

        expect(mockSend).toHaveBeenCalledTimes(1);
        const command = mockSend.mock.calls[0][0];
        expect(command._type).toBe("PutObject");
        expect(command.input.ContentType).toBe("image/png");
        expect(command.input.Body).toEqual(buffer);
        expect(result.url).toMatch(
          /^https:\/\/pub-test\.r2\.dev\/listings\/abc\/enhanced-[a-f0-9]+\.png$/,
        );
      });
    });

    describe("deleteImage", () => {
      it("deletes a single image from R2", async () => {
        mockSend.mockResolvedValue({});

        await deleteImage(
          "https://pub-test.r2.dev/listings/abc/photo-abc123.jpg",
        );

        expect(mockSend).toHaveBeenCalledTimes(1);
        const command = mockSend.mock.calls[0][0];
        expect(command._type).toBe("DeleteObject");
        expect(command.input.Key).toBe("listings/abc/photo-abc123.jpg");
        expect(command.input.Bucket).toBe("test-bucket");
      });
    });

    describe("deleteImages", () => {
      it("deletes multiple images from R2 in batch", async () => {
        mockSend.mockResolvedValue({});

        await deleteImages([
          "https://pub-test.r2.dev/listings/abc/a.jpg",
          "https://pub-test.r2.dev/listings/abc/b.jpg",
        ]);

        expect(mockSend).toHaveBeenCalledTimes(1);
        const command = mockSend.mock.calls[0][0];
        expect(command._type).toBe("DeleteObjects");
        expect(command.input.Delete.Objects).toEqual([
          { Key: "listings/abc/a.jpg" },
          { Key: "listings/abc/b.jpg" },
        ]);
      });

      it("does nothing for empty array", async () => {
        await deleteImages([]);

        expect(mockSend).not.toHaveBeenCalled();
      });
    });

    describe("createPresignedUploadUrl", () => {
      it("generates a presigned URL for a given key", async () => {
        mockGetSignedUrl.mockResolvedValue(
          "https://test-account.r2.cloudflarestorage.com/test-bucket/my-key?signature=abc",
        );

        const result = await createPresignedUploadUrl(
          "listings/abc/photo.jpg",
          "image/jpeg",
        );

        expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
        expect(result.key).toBe("listings/abc/photo.jpg");
        expect(result.publicUrl).toBe(
          "https://pub-test.r2.dev/listings/abc/photo.jpg",
        );
        expect(result.presignedUrl).toContain("signature=abc");
      });
    });
  });
});
