import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

const mockSignInEmail = vi.fn();
const mockSignOut = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => mockSignInEmail(...args),
    },
    signOut: (...args: unknown[]) => mockSignOut(...args),
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInEmail.mockResolvedValue({ data: {} });
    mockSignOut.mockResolvedValue(undefined);
  });

  describe("rendering", () => {
    it("renders admin title and description", () => {
      render(<LoginPage />);
      expect(screen.getByText("Listwell Admin")).toBeInTheDocument();
      expect(screen.getByText("Operations dashboard")).toBeInTheDocument();
    });

    it("renders login form with email and password", () => {
      render(<LoginPage />);
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /log in/i }),
      ).toBeInTheDocument();
    });

    it("does not render a signup tab", () => {
      render(<LoginPage />);
      expect(screen.queryByRole("tab", { name: /sign up/i })).not.toBeInTheDocument();
    });
  });

  describe("login flow", () => {
    it("calls signIn.email with correct credentials", async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ role: "admin" }), { status: 200 }),
      );
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText("Email"), "admin@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      expect(mockSignInEmail).toHaveBeenCalledWith({
        email: "admin@example.com",
        password: "password123",
      });
    });

    it("redirects to / on successful admin login", async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ role: "admin" }), { status: 200 }),
      );
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText("Email"), "admin@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("shows error and signs out when user is not admin", async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ role: "user" }), { status: 200 }),
      );
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText("Email"), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      expect(await screen.findByText(/admin privileges required/i)).toBeInTheDocument();
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("shows error on signIn failure", async () => {
      mockSignInEmail.mockResolvedValue({
        error: { message: "Invalid credentials" },
      });
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "wrong");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    });

    it("shows error when /me fetch fails", async () => {
      mockFetch.mockResolvedValue(new Response(null, { status: 500 }));
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText("Email"), "admin@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      expect(await screen.findByText("Failed to verify account")).toBeInTheDocument();
    });

    it("shows generic error on unexpected failure", async () => {
      mockSignInEmail.mockRejectedValue(new Error("Network error"));
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      expect(
        await screen.findByText("An unexpected error occurred"),
      ).toBeInTheDocument();
    });
  });
});
