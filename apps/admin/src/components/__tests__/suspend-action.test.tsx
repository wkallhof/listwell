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

import { SuspendAction } from "../suspend-action";

describe("SuspendAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders suspend button for active users", () => {
    render(
      <SuspendAction userId="u1" userName="Alice" isSuspended={false} />,
    );
    expect(screen.getByText("Suspend User")).toBeInTheDocument();
  });

  it("renders unsuspend button for suspended users", () => {
    render(
      <SuspendAction userId="u1" userName="Alice" isSuspended={true} />,
    );
    expect(screen.getByText("Unsuspend User")).toBeInTheDocument();
  });

  it("opens dialog when button is clicked", async () => {
    render(
      <SuspendAction userId="u1" userName="Alice" isSuspended={false} />,
    );
    await userEvent.click(screen.getByText("Suspend User"));
    expect(
      screen.getByText(/prevent Alice from creating new listings/),
    ).toBeInTheDocument();
  });

  it("shows restore message for unsuspend", async () => {
    render(
      <SuspendAction userId="u1" userName="Alice" isSuspended={true} />,
    );
    await userEvent.click(screen.getByText("Unsuspend User"));
    expect(
      screen.getByText(/restore Alice's access/),
    ).toBeInTheDocument();
  });

  it("submits suspend request on confirm", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ suspended: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(
      <SuspendAction userId="u1" userName="Alice" isSuspended={false} />,
    );

    await userEvent.click(screen.getByText("Suspend User"));
    await userEvent.type(
      screen.getByPlaceholderText("Why are you suspending this user?"),
      "Spam reports",
    );

    const confirmButtons = screen.getAllByText("Suspend User");
    const confirmButton = confirmButtons[confirmButtons.length - 1];
    await userEvent.click(confirmButton);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/users/u1/suspend",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "suspend", reason: "Spam reports" }),
      }),
    );

    vi.unstubAllGlobals();
  });
});
