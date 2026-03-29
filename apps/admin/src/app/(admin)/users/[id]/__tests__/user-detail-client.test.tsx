import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { UserDetailClient } from "../user-detail-client";

const mockUser = {
  id: "u1",
  name: "Alice Smith",
  email: "alice@example.com",
  role: "user",
  suspended: false,
  suspendedReason: null,
  createdAt: "2026-01-15T00:00:00Z",
  updatedAt: "2026-03-01T00:00:00Z",
};

const mockCredits = { balance: 5, freeCreditsGranted: true };

const mockListings = { total: 10, ready: 7, processing: 1, errored: 2 };

const mockTransactions = [
  {
    id: "tx1",
    type: "FREE_GRANT",
    amount: 2,
    balanceAfter: 2,
    listingId: null,
    appleTransactionId: null,
    adminUserId: null,
    reason: null,
    note: "Welcome bonus",
    createdAt: "2026-01-15T00:00:00Z",
  },
];

const mockActivities = [
  {
    id: "act1",
    userId: "u1",
    eventType: "LOGIN",
    description: "User signed in",
    resourceType: null,
    resourceId: null,
    metadata: null,
    createdAt: "2026-03-01T00:00:00Z",
  },
];

describe("UserDetailClient", () => {
  it("renders user name and email", () => {
    render(
      <UserDetailClient
        user={mockUser}
        credits={mockCredits}
        listings={mockListings}
        transactions={mockTransactions}
        activities={mockActivities}
      />,
    );
    expect(screen.getAllByText("Alice Smith").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("alice@example.com").length).toBeGreaterThanOrEqual(1);
  });

  it("renders stat cards", () => {
    render(
      <UserDetailClient
        user={mockUser}
        credits={mockCredits}
        listings={mockListings}
        transactions={mockTransactions}
        activities={mockActivities}
      />,
    );
    expect(screen.getByText("Credit Balance")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Total Listings")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows suspended badge when user is suspended", () => {
    render(
      <UserDetailClient
        user={{ ...mockUser, suspended: true, suspendedReason: "Spam reports" }}
        credits={mockCredits}
        listings={mockListings}
        transactions={mockTransactions}
        activities={mockActivities}
      />,
    );
    const suspendedElements = screen.getAllByText("Suspended");
    expect(suspendedElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Spam reports/)).toBeInTheDocument();
  });

  it("renders tabs", () => {
    render(
      <UserDetailClient
        user={mockUser}
        credits={mockCredits}
        listings={mockListings}
        transactions={mockTransactions}
        activities={mockActivities}
      />,
    );
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Credit History")).toBeInTheDocument();
    expect(screen.getByText("Listings")).toBeInTheDocument();
    expect(screen.getByText("Activity")).toBeInTheDocument();
  });

  it("renders profile information in overview tab", () => {
    render(
      <UserDetailClient
        user={mockUser}
        credits={mockCredits}
        listings={mockListings}
        transactions={mockTransactions}
        activities={mockActivities}
      />,
    );
    expect(screen.getByText("Profile Information")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders back link to users list", () => {
    render(
      <UserDetailClient
        user={mockUser}
        credits={mockCredits}
        listings={mockListings}
        transactions={mockTransactions}
        activities={mockActivities}
      />,
    );
    const backLink = screen.getAllByRole("link").find((l) => l.getAttribute("href") === "/users");
    expect(backLink).toBeInTheDocument();
  });
});
