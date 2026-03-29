import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomBar } from "@/components/bottom-bar";

describe("BottomBar", () => {
  it("renders children", () => {
    render(
      <BottomBar>
        <button>Action</button>
      </BottomBar>,
    );
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("has fixed positioning and backdrop blur", () => {
    const { container } = render(
      <BottomBar>
        <span>Content</span>
      </BottomBar>,
    );
    const bar = container.firstElementChild;
    expect(bar?.className).toContain("fixed");
    expect(bar?.className).toContain("bottom-0");
    expect(bar?.className).toContain("backdrop-blur-lg");
  });

  it("has border-t for visual separation", () => {
    const { container } = render(
      <BottomBar>
        <span>Content</span>
      </BottomBar>,
    );
    const bar = container.firstElementChild;
    expect(bar?.className).toContain("border-t");
  });
});
