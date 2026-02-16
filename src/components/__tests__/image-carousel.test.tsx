import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImageCarousel } from "@/components/image-carousel";

describe("ImageCarousel", () => {
  const mockImages = [
    { id: "img-1", blobUrl: "https://blob.test/img1.jpg", type: "ORIGINAL" },
    { id: "img-2", blobUrl: "https://blob.test/img2.jpg", type: "ORIGINAL" },
    { id: "img-3", blobUrl: "https://blob.test/img3.jpg", type: "ENHANCED" },
  ];

  it("renders all images", () => {
    const { container } = render(<ImageCarousel images={mockImages} />);

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(3);
  });

  it("renders dot indicators for multiple images", () => {
    render(<ImageCarousel images={mockImages} />);

    const dots = screen.getAllByRole("tab");
    expect(dots).toHaveLength(3);
  });

  it("does not render dot indicators for single image", () => {
    render(<ImageCarousel images={[mockImages[0]]} />);

    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("renders empty state when no images", () => {
    const { container } = render(<ImageCarousel images={[]} />);

    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("marks first dot as active by default", () => {
    render(<ImageCarousel images={mockImages} />);

    const dots = screen.getAllByRole("tab");
    expect(dots[0]).toHaveAttribute("aria-selected", "true");
    expect(dots[1]).toHaveAttribute("aria-selected", "false");
  });

  it("renders carousel region", () => {
    render(<ImageCarousel images={mockImages} />);

    expect(screen.getByRole("region", { name: "Image carousel" })).toBeInTheDocument();
  });

  it("loads first image eagerly and rest lazily", () => {
    const { container } = render(<ImageCarousel images={mockImages} />);

    const images = container.querySelectorAll("img");
    expect(images[0]).toHaveAttribute("loading", "eager");
    expect(images[1]).toHaveAttribute("loading", "lazy");
    expect(images[2]).toHaveAttribute("loading", "lazy");
  });

  it("sets decoding=async on all images", () => {
    const { container } = render(<ImageCarousel images={mockImages} />);

    const images = container.querySelectorAll("img");
    images.forEach((img) => {
      expect(img).toHaveAttribute("decoding", "async");
    });
  });

  it("has smooth scrolling enabled", () => {
    render(<ImageCarousel images={mockImages} />);

    const carousel = screen.getByRole("region", { name: "Image carousel" });
    expect(carousel.className).toContain("scroll-smooth");
  });
});
