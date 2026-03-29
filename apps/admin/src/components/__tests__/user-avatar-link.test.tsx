import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserAvatarLink } from "@/components/user-avatar-link";

describe("UserAvatarLink", () => {
  it("renders initial when no image provided", () => {
    render(<UserAvatarLink name="Alice" image={null} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/preferences");
  });

  it("renders image when provided", () => {
    render(
      <UserAvatarLink name="Alice" image="https://example.com/avatar.jpg" />,
    );
    expect(screen.getByAltText("Alice")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/avatar.jpg",
    );
  });

  it("renders ? when no name or image", () => {
    render(<UserAvatarLink name={null} image={null} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("has accessible label", () => {
    render(<UserAvatarLink name="Alice" image={null} />);
    expect(screen.getByLabelText("Preferences")).toBeInTheDocument();
  });
});
