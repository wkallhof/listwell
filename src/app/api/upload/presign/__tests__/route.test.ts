// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetSession = vi.fn();
const mockCreatePresignedUploadUrl = vi.fn();

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock("@/lib/blob", () => ({
  createPresignedUploadUrl: (...args: unknown[]) =>
    mockCreatePresignedUploadUrl(...args),
}));

import { POST } from "@/app/api/upload/presign/route";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/upload/presign", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await POST(makeRequest({ files: [] }));

    expect(res.status).toBe(401);
  });

  it("returns 400 when no files provided", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });

    const res = await POST(makeRequest({ files: [] }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("At least one file is required");
  });

  it("returns 400 when too many files", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });

    const files = Array.from({ length: 6 }, (_, i) => ({
      filename: `photo${i}.jpg`,
      contentType: "image/jpeg",
    }));

    const res = await POST(makeRequest({ files }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Maximum 5 files allowed");
  });

  it("returns 400 for unsupported content type", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });

    const res = await POST(
      makeRequest({
        files: [{ filename: "doc.pdf", contentType: "application/pdf" }],
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Unsupported file type: application/pdf");
  });

  it("returns presigned URLs for valid request", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockCreatePresignedUploadUrl.mockImplementation(
      async (key: string) => ({
        presignedUrl: `https://r2.test/presigned/${key}`,
        key,
        publicUrl: `https://pub.r2.dev/${key}`,
      }),
    );

    const res = await POST(
      makeRequest({
        files: [
          { filename: "photo.jpg", contentType: "image/jpeg" },
          { filename: "photo2.png", contentType: "image/png" },
        ],
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.uploads).toHaveLength(2);
    expect(body.uploads[0].presignedUrl).toContain("presigned/");
    expect(body.uploads[0].publicUrl).toContain("pub.r2.dev/");
    expect(mockCreatePresignedUploadUrl).toHaveBeenCalledTimes(2);
  });

  it("accepts image/heic content type", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "user-1" } });
    mockCreatePresignedUploadUrl.mockResolvedValue({
      presignedUrl: "https://r2.test/presigned",
      key: "test-key",
      publicUrl: "https://pub.r2.dev/test-key",
    });

    const res = await POST(
      makeRequest({
        files: [{ filename: "photo.heic", contentType: "image/heic" }],
      }),
    );

    expect(res.status).toBe(200);
  });
});
