import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PreferencesPage from "../page";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockSetTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: mockSetTheme,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: vi.fn().mockResolvedValue(undefined),
  },
}));

function mockFetchResponses() {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    const path = typeof url === "string" ? url : url.toString();
    if (path.includes("/api/me")) {
      return Response.json({ id: "u1", name: "Alice", email: "alice@test.com" });
    }
    if (path.includes("/api/preferences")) {
      return Response.json({ themePreference: "system", notificationsEnabled: true });
    }
    return Response.json({});
  });
}

describe("PreferencesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all sections after loading", async () => {
    mockFetchResponses();
    render(<PreferencesPage />);

    await waitFor(() => {
      expect(screen.getByText("Preferences")).toBeInTheDocument();
    });

    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
  });

  it("renders theme options", async () => {
    mockFetchResponses();
    render(<PreferencesPage />);

    await waitFor(() => {
      expect(screen.getByText("Light")).toBeInTheDocument();
    });

    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("changes theme when option clicked", async () => {
    mockFetchResponses();
    const user = userEvent.setup();
    render(<PreferencesPage />);

    await waitFor(() => {
      expect(screen.getByText("Dark")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Dark"));

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("navigates to / when back button clicked", async () => {
    mockFetchResponses();
    const user = userEvent.setup();
    render(<PreferencesPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Back")).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("Back"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
