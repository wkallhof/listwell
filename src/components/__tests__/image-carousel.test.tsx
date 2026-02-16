import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
    expect(carousel).toHaveClass("scroll-smooth");
  });

  it("renders enhance button on ORIGINAL images when onEnhance is provided", () => {
    const onEnhance = vi.fn();
    render(<ImageCarousel images={mockImages} onEnhance={onEnhance} />);

    const enhanceButtons = screen.getAllByLabelText("Enhance this image");
    // Only ORIGINAL images (img-1, img-2) should have enhance button
    expect(enhanceButtons).toHaveLength(2);
  });

  it("does not render enhance button on ENHANCED images", () => {
    const onEnhance = vi.fn();
    const enhancedOnly = [
      { id: "img-3", blobUrl: "https://blob.test/img3.jpg", type: "ENHANCED" },
    ];
    render(<ImageCarousel images={enhancedOnly} onEnhance={onEnhance} />);

    expect(screen.queryByLabelText("Enhance this image")).not.toBeInTheDocument();
  });

  it("does not render enhance button when onEnhance is not provided", () => {
    render(<ImageCarousel images={mockImages} />);

    expect(screen.queryByLabelText("Enhance this image")).not.toBeInTheDocument();
  });

  it("calls onEnhance with image id when enhance button is clicked", () => {
    const onEnhance = vi.fn();
    render(<ImageCarousel images={mockImages} onEnhance={onEnhance} />);

    const enhanceButtons = screen.getAllByLabelText("Enhance this image");
    fireEvent.click(enhanceButtons[0]);

    expect(onEnhance).toHaveBeenCalledWith("img-1");
  });

  it("updates active dot on scroll", () => {
    render(<ImageCarousel images={mockImages} />);

    const carousel = screen.getByRole("region", { name: "Image carousel" });

    // Simulate scrolling to second image
    Object.defineProperty(carousel, "scrollLeft", { value: 375, writable: true });
    Object.defineProperty(carousel, "clientWidth", { value: 375, writable: true });

    fireEvent.scroll(carousel);

    const dots = screen.getAllByRole("tab");
    expect(dots[1]).toHaveAttribute("aria-selected", "true");
    expect(dots[0]).toHaveAttribute("aria-selected", "false");
  });
});
