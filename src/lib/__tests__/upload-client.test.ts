import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock XMLHttpRequest with a proper class
interface ProgressEvent {
  lengthComputable: boolean;
  loaded: number;
  total: number;
}

type XHREventHandler = ((e?: ProgressEvent) => void);

let xhrInstances: MockXHR[] = [];

class MockXHR {
  open = vi.fn();
  send = vi.fn();
  setRequestHeader = vi.fn();
  status = 200;

  private uploadListeners: Record<string, XHREventHandler> = {};
  private listeners: Record<string, XHREventHandler> = {};

  upload = {
    addEventListener: (event: string, handler: XHREventHandler) => {
      this.uploadListeners[event] = handler;
    },
  };

  addEventListener = (event: string, handler: XHREventHandler) => {
    this.listeners[event] = handler;
  };

  simulateProgress(loaded: number, total: number) {
    this.uploadListeners["progress"]?.({
      lengthComputable: true,
      loaded,
      total,
    });
  }

  simulateSuccess() {
    this.listeners["load"]?.();
  }

  simulateError() {
    this.listeners["error"]?.();
  }
}

vi.stubGlobal("XMLHttpRequest", MockXHR);

import { uploadImages } from "@/lib/upload-client";

beforeEach(() => {
  vi.clearAllMocks();
  xhrInstances = [];

  // Track instances created during tests
  vi.stubGlobal(
    "XMLHttpRequest",
    class extends MockXHR {
      constructor() {
        super();
        xhrInstances.push(this);
      }
    },
  );
});

describe("uploadImages", () => {
  it("requests presigned URLs and uploads files", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          uploads: [
            {
              presignedUrl: "https://r2.test/presigned/key1",
              key: "listings/abc/photo.jpg",
              publicUrl: "https://pub.r2.dev/listings/abc/photo.jpg",
            },
          ],
        }),
      ),
    );

    const file = new File(["image data"], "photo.jpg", {
      type: "image/jpeg",
    });

    const promise = uploadImages([file]);

    // Wait for fetch and XHR setup
    await vi.waitFor(() => expect(xhrInstances.length).toBe(1));

    // Simulate successful upload
    xhrInstances[0].simulateSuccess();

    const result = await promise;

    expect(result).toEqual([
      {
        key: "listings/abc/photo.jpg",
        url: "https://pub.r2.dev/listings/abc/photo.jpg",
        filename: "photo.jpg",
      },
    ]);

    // Verify fetch was called with correct body
    expect(mockFetch).toHaveBeenCalledWith("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: [{ filename: "photo.jpg", contentType: "image/jpeg" }],
      }),
    });

    // Verify XHR was opened with presigned URL
    expect(xhrInstances[0].open).toHaveBeenCalledWith(
      "PUT",
      "https://r2.test/presigned/key1",
    );
    expect(xhrInstances[0].setRequestHeader).toHaveBeenCalledWith(
      "Content-Type",
      "image/jpeg",
    );
  });

  it("calls onProgress during upload", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          uploads: [
            {
              presignedUrl: "https://r2.test/presigned/key1",
              key: "k1",
              publicUrl: "https://pub.r2.dev/k1",
            },
          ],
        }),
      ),
    );

    const file = new File(["image data"], "photo.jpg", {
      type: "image/jpeg",
    });
    Object.defineProperty(file, "size", { value: 1000 });

    const onProgress = vi.fn();
    const promise = uploadImages([file], onProgress);

    await vi.waitFor(() => expect(xhrInstances.length).toBe(1));

    // Simulate progress event
    xhrInstances[0].simulateProgress(500, 1000);

    expect(onProgress).toHaveBeenCalledWith(0.5);

    xhrInstances[0].simulateSuccess();
    await promise;
  });

  it("throws on fetch failure", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );

    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });

    await expect(uploadImages([file])).rejects.toThrow("Unauthorized");
  });

  it("throws on XHR error", async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          uploads: [
            {
              presignedUrl: "https://r2.test/presigned/key1",
              key: "k1",
              publicUrl: "https://pub.r2.dev/k1",
            },
          ],
        }),
      ),
    );

    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    const promise = uploadImages([file]);

    await vi.waitFor(() => expect(xhrInstances.length).toBe(1));

    xhrInstances[0].simulateError();

    await expect(promise).rejects.toThrow("Upload failed");
  });
});
