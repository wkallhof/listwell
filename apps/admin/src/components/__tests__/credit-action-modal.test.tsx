import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { CreditActionModal } from "../credit-action-modal";

describe("CreditActionModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders grant button", () => {
    render(
      <CreditActionModal
        userId="u1"
        userName="Alice"
        currentBalance={5}
        action="grant"
      />,
    );
    expect(screen.getByText("Grant Credits")).toBeInTheDocument();
  });

  it("renders deduct button", () => {
    render(
      <CreditActionModal
        userId="u1"
        userName="Alice"
        currentBalance={5}
        action="deduct"
      />,
    );
    expect(screen.getByText("Deduct Credits")).toBeInTheDocument();
  });

  it("opens dialog when button is clicked", async () => {
    render(
      <CreditActionModal
        userId="u1"
        userName="Alice"
        currentBalance={5}
        action="grant"
      />,
    );
    await userEvent.click(screen.getByText("Grant Credits"));
    expect(screen.getByLabelText("Amount")).toBeInTheDocument();
    expect(screen.getByLabelText("Reason (required)")).toBeInTheDocument();
  });

  it("shows current balance in description", async () => {
    render(
      <CreditActionModal
        userId="u1"
        userName="Alice"
        currentBalance={5}
        action="grant"
      />,
    );
    await userEvent.click(screen.getByText("Grant Credits"));
    expect(screen.getByText(/Current balance: 5/)).toBeInTheDocument();
  });

  it("submits grant request on confirm", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ balance: 10 }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(
      <CreditActionModal
        userId="u1"
        userName="Alice"
        currentBalance={5}
        action="grant"
      />,
    );

    await userEvent.click(screen.getByText("Grant Credits"));
    await userEvent.type(screen.getByPlaceholderText("Number of credits"), "5");
    await userEvent.type(
      screen.getByPlaceholderText("Why are you granting/deducting credits?"),
      "Test reason",
    );

    // The AlertDialogAction button inside the dialog
    const confirmButtons = screen.getAllByText("Grant Credits");
    const confirmButton = confirmButtons[confirmButtons.length - 1];
    await userEvent.click(confirmButton);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/users/u1/credits",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "grant", amount: 5, reason: "Test reason" }),
      }),
    );

    vi.unstubAllGlobals();
  });
});
