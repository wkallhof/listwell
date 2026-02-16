// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers()),
}));

const mockCreate = vi.fn();
vi.mock("openai", () => ({
  default: class {
    audio = {
      transcriptions: {
        create: (...args: unknown[]) => mockCreate(...args),
      },
    };
  },
}));

import { POST } from "@/app/api/transcribe/route";

const mockSession = {
  user: { id: "user-1", email: "test@example.com", name: "Test" },
  session: { id: "session-1" },
};

function createAudioRequest(
  file?: File | null,
  contentType = "audio/webm",
): NextRequest {
  const formData = new FormData();
  if (file !== null) {
    formData.append(
      "audio",
      file ?? new File(["audio-data"], "recording.webm", { type: contentType }),
    );
  }
  return new NextRequest("http://localhost/api/transcribe", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/transcribe", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await POST(createAudioRequest());

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when no audio file provided", async () => {
    mockGetSession.mockResolvedValue(mockSession);

    const formData = new FormData();
    const request = new NextRequest("http://localhost/api/transcribe", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("No audio file provided");
  });

  it("returns 400 for oversized files", async () => {
    mockGetSession.mockResolvedValue(mockSession);

    const largeContent = new Uint8Array(26 * 1024 * 1024);
    const largeFile = new File([largeContent], "recording.webm", {
      type: "audio/webm",
    });

    const response = await POST(createAudioRequest(largeFile));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Audio file too large (max 25MB)");
  });

  it("returns 400 for unsupported audio format", async () => {
    mockGetSession.mockResolvedValue(mockSession);

    const file = new File(["data"], "test.txt", { type: "text/plain" });
    const response = await POST(createAudioRequest(file, "text/plain"));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Unsupported audio format");
  });

  it("returns transcript on success", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockCreate.mockResolvedValue({ text: "This is a test transcription" });

    const response = await POST(createAudioRequest());

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.text).toBe("This is a test transcription");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "whisper-1",
        language: "en",
      }),
    );
  });

  it("accepts various audio formats", async () => {
    mockGetSession.mockResolvedValue(mockSession);
    mockCreate.mockResolvedValue({ text: "test" });

    for (const type of ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav"]) {
      const file = new File(["data"], "recording", { type });
      const response = await POST(createAudioRequest(file, type));
      expect(response.status).toBe(200);
    }
  });
});
