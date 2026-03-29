import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

import { VoiceInput } from "@/components/voice-input";
import { toast } from "sonner";

const mockStopTrack = vi.fn();
const mockGetUserMedia = vi.fn();

interface MockMediaRecorder {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  state: string;
  ondataavailable: ((e: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
}

let capturedRecorder: MockMediaRecorder | null = null;

beforeEach(() => {
  vi.clearAllMocks();
  capturedRecorder = null;

  // Mock MediaRecorder as a proper class
  const MockMediaRecorderClass = vi.fn().mockImplementation(function (this: MockMediaRecorder) {
    this.start = vi.fn(() => { this.state = "recording"; });
    this.stop = vi.fn(() => {
      this.state = "inactive";
      setTimeout(() => this.onstop?.(), 0);
    });
    this.state = "inactive";
    this.ondataavailable = null;
    this.onstop = null;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    capturedRecorder = this;
  }) as unknown as typeof MediaRecorder;

  MockMediaRecorderClass.isTypeSupported = () => true;
  vi.stubGlobal("MediaRecorder", MockMediaRecorderClass);

  mockGetUserMedia.mockResolvedValue({
    getTracks: () => [{ stop: mockStopTrack }],
  });

  // Ensure navigator.mediaDevices exists
  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, "mediaDevices", {
      value: {},
      writable: true,
      configurable: true,
    });
  }
  Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
    value: mockGetUserMedia,
    writable: true,
    configurable: true,
  });

  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("VoiceInput", () => {
  it("renders mic button with correct aria label", () => {
    render(<VoiceInput onTranscript={vi.fn()} />);

    const button = screen.getByRole("button", { name: "Start voice input" });
    expect(button).toBeInTheDocument();
  });

  it("starts recording when mic button is clicked", async () => {
    const user = userEvent.setup();
    render(<VoiceInput onTranscript={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Start voice input" }));

    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(capturedRecorder).not.toBeNull();
    expect(capturedRecorder!.start).toHaveBeenCalled();
  });

  it("shows recording indicator when recording", async () => {
    const user = userEvent.setup();
    render(<VoiceInput onTranscript={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Start voice input" }));

    expect(screen.getByText("Listening...")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Stop recording" }),
    ).toBeInTheDocument();
  });

  it("stops recording on second click", async () => {
    const user = userEvent.setup();
    render(<VoiceInput onTranscript={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Start voice input" }));

    await user.click(screen.getByRole("button", { name: "Stop recording" }));

    expect(capturedRecorder!.stop).toHaveBeenCalled();
  });

  it("sends audio to transcribe API and calls onTranscript", async () => {
    const onTranscript = vi.fn();
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ text: "Hello world" }),
    });

    render(<VoiceInput onTranscript={onTranscript} />);

    await user.click(screen.getByRole("button", { name: "Start voice input" }));

    // Simulate data and stop
    await act(async () => {
      capturedRecorder!.ondataavailable?.({
        data: new Blob(["audio"], { type: "audio/webm" }),
      });
      capturedRecorder!.onstop?.();
      // Wait for async transcription
      await new Promise((r) => setTimeout(r, 10));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/transcribe", {
        method: "POST",
        body: expect.any(FormData),
      });
    });

    await waitFor(() => {
      expect(onTranscript).toHaveBeenCalledWith("Hello world");
    });
  });

  it("shows error toast when microphone access is denied", async () => {
    const user = userEvent.setup();
    mockGetUserMedia.mockRejectedValue(new Error("Permission denied"));

    render(<VoiceInput onTranscript={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Start voice input" }));

    expect(toast.error).toHaveBeenCalledWith("Microphone access denied");
  });

  it("shows error toast when transcription fails", async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Transcription failed" }),
    });

    render(<VoiceInput onTranscript={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Start voice input" }));

    await act(async () => {
      capturedRecorder!.ondataavailable?.({
        data: new Blob(["audio"], { type: "audio/webm" }),
      });
      capturedRecorder!.onstop?.();
      await new Promise((r) => setTimeout(r, 10));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Transcription failed");
    });
  });

  it("is disabled when disabled prop is true", () => {
    render(<VoiceInput onTranscript={vi.fn()} disabled />);

    expect(
      screen.getByRole("button", { name: "Start voice input" }),
    ).toBeDisabled();
  });

  it("shows transcribing indicator during API call", async () => {
    const user = userEvent.setup();
    let resolveResponse: (value: unknown) => void;
    const responsePromise = new Promise((resolve) => {
      resolveResponse = resolve;
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(responsePromise);

    render(<VoiceInput onTranscript={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Start voice input" }));

    await act(async () => {
      capturedRecorder!.ondataavailable?.({
        data: new Blob(["audio"], { type: "audio/webm" }),
      });
      capturedRecorder!.onstop?.();
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(screen.getByText("Transcribing...")).toBeInTheDocument();

    await act(async () => {
      resolveResponse!({
        ok: true,
        json: () => Promise.resolve({ text: "test" }),
      });
      await new Promise((r) => setTimeout(r, 10));
    });
  });

  it("uses fallback mime type when opus is not supported", async () => {
    const user = userEvent.setup();
    (MediaRecorder as unknown as { isTypeSupported: (t: string) => boolean }).isTypeSupported = () => false;

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ text: "test" }),
    });

    render(<VoiceInput onTranscript={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Start voice input" }));

    expect(capturedRecorder).not.toBeNull();
    expect(MediaRecorder).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ mimeType: "audio/webm" }),
    );
  });

  it("handles error response without error field", async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });

    render(<VoiceInput onTranscript={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Start voice input" }));

    await act(async () => {
      capturedRecorder!.ondataavailable?.({
        data: new Blob(["audio"], { type: "audio/webm" }),
      });
      capturedRecorder!.onstop?.();
      await new Promise((r) => setTimeout(r, 10));
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Transcription failed");
    });
  });

  it("skips empty audio blobs", async () => {
    const user = userEvent.setup();

    render(<VoiceInput onTranscript={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Start voice input" }));

    await act(async () => {
      // Don't add any data chunks, so blob will be empty
      capturedRecorder!.onstop?.();
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does not call onTranscript for empty transcription", async () => {
    const onTranscript = vi.fn();
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ text: "   " }),
    });

    render(<VoiceInput onTranscript={onTranscript} />);

    await user.click(screen.getByRole("button", { name: "Start voice input" }));

    await act(async () => {
      capturedRecorder!.ondataavailable?.({
        data: new Blob(["audio"], { type: "audio/webm" }),
      });
      capturedRecorder!.onstop?.();
      await new Promise((r) => setTimeout(r, 10));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(onTranscript).not.toHaveBeenCalled();
  });
});
