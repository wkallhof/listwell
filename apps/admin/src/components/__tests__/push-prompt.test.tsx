import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PushPrompt } from "@/components/push-prompt";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockLocalStorage: Record<string, string> = {};

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(mockLocalStorage).forEach(
    (key) => delete mockLocalStorage[key],
  );
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => mockLocalStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      mockLocalStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockLocalStorage[key];
    },
    clear: () =>
      Object.keys(mockLocalStorage).forEach(
        (key) => delete mockLocalStorage[key],
      ),
    length: 0,
    key: () => null,
  });
});

function stubPushSupport() {
  (window as unknown as Record<string, unknown>).PushManager = {};
  Object.defineProperty(navigator, "serviceWorker", {
    value: { ready: Promise.resolve({ pushManager: { subscribe: vi.fn() } }) },
    writable: true,
    configurable: true,
  });
  vi.stubGlobal("Notification", {
    permission: "default",
    requestPermission: vi.fn(),
  });
}

describe("PushPrompt", () => {
  it("renders nothing when push is not supported", () => {
    const { container } = render(<PushPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it("renders prompt when push is supported and permission is default", () => {
    stubPushSupport();

    render(<PushPrompt />);

    expect(
      screen.getByText("Get notified when listings are ready"),
    ).toBeInTheDocument();
    expect(screen.getByText("Enable")).toBeInTheDocument();
    expect(screen.getByText("Not now")).toBeInTheDocument();
  });

  it("renders nothing when permission is already granted", () => {
    stubPushSupport();
    vi.stubGlobal("Notification", {
      permission: "granted",
      requestPermission: vi.fn(),
    });

    const { container } = render(<PushPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when previously dismissed", () => {
    stubPushSupport();
    mockLocalStorage["listwell-push-dismissed"] = "1";

    const { container } = render(<PushPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it("dismisses prompt and saves to localStorage on Not now click", async () => {
    stubPushSupport();

    render(<PushPrompt />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Not now"));

    expect(mockLocalStorage["listwell-push-dismissed"]).toBe("1");
    expect(
      screen.queryByText("Get notified when listings are ready"),
    ).not.toBeInTheDocument();
  });

  it("dismisses prompt on X button click", async () => {
    stubPushSupport();

    render(<PushPrompt />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Dismiss"));

    expect(mockLocalStorage["listwell-push-dismissed"]).toBe("1");
  });
});
