import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { UsersListClient } from "../users-list-client";

const mockUsers = [
  {
    id: "u1",
    name: "Alice Smith",
    email: "alice@example.com",
    role: "user",
    suspended: false,
    createdAt: "2026-01-15T00:00:00Z",
    creditBalance: 5,
    totalListings: 3,
  },
  {
    id: "u2",
    name: "Bob Jones",
    email: "bob@example.com",
    role: "user",
    suspended: true,
    createdAt: "2026-02-01T00:00:00Z",
    creditBalance: 0,
    totalListings: 1,
  },
];

const mockPagination = { page: 1, limit: 20, total: 2, totalPages: 1 };

describe("UsersListClient", () => {
  it("renders user table with data", () => {
    render(
      <UsersListClient
        users={mockUsers}
        pagination={mockPagination}
        initialSearch=""
        currentSortBy="createdAt"
        currentSortOrder="desc"
      />,
    );

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("shows suspended badge for suspended users", () => {
    render(
      <UsersListClient
        users={mockUsers}
        pagination={mockPagination}
        initialSearch=""
        currentSortBy="createdAt"
        currentSortOrder="desc"
      />,
    );

    expect(screen.getByText("Suspended")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(
      <UsersListClient
        users={mockUsers}
        pagination={mockPagination}
        initialSearch=""
        currentSortBy="createdAt"
        currentSortOrder="desc"
      />,
    );

    expect(
      screen.getByPlaceholderText("Search by name or email..."),
    ).toBeInTheDocument();
  });

  it("renders user name as link to detail page", () => {
    render(
      <UsersListClient
        users={mockUsers}
        pagination={mockPagination}
        initialSearch=""
        currentSortBy="createdAt"
        currentSortOrder="desc"
      />,
    );

    const link = screen.getByText("Alice Smith").closest("a");
    expect(link).toHaveAttribute("href", "/users/u1");
  });

  it("shows credit balance and listing count", () => {
    render(
      <UsersListClient
        users={mockUsers}
        pagination={mockPagination}
        initialSearch=""
        currentSortBy="createdAt"
        currentSortOrder="desc"
      />,
    );

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
