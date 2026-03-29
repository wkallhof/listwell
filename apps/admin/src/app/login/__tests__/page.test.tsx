import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
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

// Mock auth client
const mockSignInEmail = vi.fn();
const mockSignUpEmail = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => mockSignInEmail(...args),
    },
    signUp: {
      email: (...args: unknown[]) => mockSignUpEmail(...args),
    },
  },
}));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInEmail.mockResolvedValue({ data: {} });
    mockSignUpEmail.mockResolvedValue({ data: {} });
  });

  describe("rendering", () => {
    it("renders the app name and tagline", () => {
      render(<LoginPage />);
      expect(screen.getByText("Listwell")).toBeInTheDocument();
      expect(
        screen.getByText("Turn photos into listings"),
      ).toBeInTheDocument();
    });

    it("renders login and register tabs", () => {
      render(<LoginPage />);
      expect(screen.getByRole("tab", { name: /log in/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /sign up/i }),
      ).toBeInTheDocument();
    });

    it("shows login form by default", () => {
      render(<LoginPage />);
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /log in/i }),
      ).toBeInTheDocument();
    });

    it("switches to register form when clicking Sign up tab", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.click(screen.getByRole("tab", { name: /sign up/i }));

      expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create account/i }),
      ).toBeInTheDocument();
    });
  });

  describe("login form", () => {
    it("calls signIn.email with correct credentials", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      expect(mockSignInEmail).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("redirects to / on successful login", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("shows error message on login failure", async () => {
      mockSignInEmail.mockResolvedValue({
        error: { message: "Invalid credentials" },
      });
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "wrong");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      expect(
        await screen.findByText("Invalid credentials"),
      ).toBeInTheDocument();
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

  describe("register form", () => {
    it("calls signUp.email with correct data", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.click(screen.getByRole("tab", { name: /sign up/i }));
      await user.type(screen.getByLabelText("Email"), "new@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.type(
        screen.getByLabelText("Confirm password"),
        "password123",
      );
      await user.click(
        screen.getByRole("button", { name: /create account/i }),
      );

      expect(mockSignUpEmail).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "password123",
        name: "new",
      });
    });

    it("redirects to / on successful registration", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.click(screen.getByRole("tab", { name: /sign up/i }));
      await user.type(screen.getByLabelText("Email"), "new@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.type(
        screen.getByLabelText("Confirm password"),
        "password123",
      );
      await user.click(
        screen.getByRole("button", { name: /create account/i }),
      );

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("shows error when passwords do not match", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.click(screen.getByRole("tab", { name: /sign up/i }));
      await user.type(screen.getByLabelText("Email"), "new@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.type(
        screen.getByLabelText("Confirm password"),
        "different123",
      );
      await user.click(
        screen.getByRole("button", { name: /create account/i }),
      );

      expect(
        await screen.findByText("Passwords do not match"),
      ).toBeInTheDocument();
      expect(mockSignUpEmail).not.toHaveBeenCalled();
    });

    it("shows error when password is too short", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.click(screen.getByRole("tab", { name: /sign up/i }));
      await user.type(screen.getByLabelText("Email"), "new@example.com");
      await user.type(screen.getByLabelText("Password"), "short");
      await user.type(screen.getByLabelText("Confirm password"), "short");
      await user.click(
        screen.getByRole("button", { name: /create account/i }),
      );

      expect(
        await screen.findByText("Password must be at least 8 characters"),
      ).toBeInTheDocument();
      expect(mockSignUpEmail).not.toHaveBeenCalled();
    });

    it("shows error message on registration failure", async () => {
      mockSignUpEmail.mockResolvedValue({
        error: { message: "Email already registered" },
      });
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.click(screen.getByRole("tab", { name: /sign up/i }));
      await user.type(screen.getByLabelText("Email"), "existing@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.type(
        screen.getByLabelText("Confirm password"),
        "password123",
      );
      await user.click(
        screen.getByRole("button", { name: /create account/i }),
      );

      expect(
        await screen.findByText("Email already registered"),
      ).toBeInTheDocument();
    });
  });

  describe("tab behavior", () => {
    it("clears error when switching tabs", async () => {
      mockSignInEmail.mockResolvedValue({
        error: { message: "Invalid credentials" },
      });
      const user = userEvent.setup();
      render(<LoginPage />);

      await user.type(screen.getByLabelText("Email"), "test@example.com");
      await user.type(screen.getByLabelText("Password"), "wrong");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      expect(
        await screen.findByText("Invalid credentials"),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("tab", { name: /sign up/i }));

      expect(
        screen.queryByText("Invalid credentials"),
      ).not.toBeInTheDocument();
    });
  });
});
