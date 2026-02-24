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

  it("uses object-contain to show full images without cropping", () => {
    const { container } = render(<ImageCarousel images={mockImages} />);

    const images = container.querySelectorAll("img");
    images.forEach((img) => {
      expect(img).toHaveClass("object-contain");
    });
  });

  it("opens fullscreen viewer when image is clicked", () => {
    const { container } = render(<ImageCarousel images={mockImages} />);

    const images = container.querySelectorAll("img");
    fireEvent.click(images[0]);

    expect(screen.getByRole("dialog", { name: "Fullscreen image viewer" })).toBeInTheDocument();
  });

  it("shows close button in fullscreen viewer", () => {
    const { container } = render(<ImageCarousel images={mockImages} />);

    const images = container.querySelectorAll("img");
    fireEvent.click(images[0]);

    expect(screen.getByLabelText("Close fullscreen")).toBeInTheDocument();
  });

  it("shows image counter in fullscreen viewer", () => {
    const { container } = render(<ImageCarousel images={mockImages} />);

    const images = container.querySelectorAll("img");
    fireEvent.click(images[0]);

    expect(screen.getByText(/1 of 3/)).toBeInTheDocument();
  });

  it("closes fullscreen viewer when close button is clicked", () => {
    const { container } = render(<ImageCarousel images={mockImages} />);

    const images = container.querySelectorAll("img");
    fireEvent.click(images[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close fullscreen"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes fullscreen viewer on Escape key", () => {
    const { container } = render(<ImageCarousel images={mockImages} />);

    const images = container.querySelectorAll("img");
    fireEvent.click(images[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows trash button in fullscreen viewer when onDelete is provided", () => {
    const onDelete = vi.fn();
    const { container } = render(
      <ImageCarousel images={mockImages} onDelete={onDelete} />,
    );

    const images = container.querySelectorAll("img");
    fireEvent.click(images[0]);

    expect(screen.getByLabelText("Delete image")).toBeInTheDocument();
  });

  it("does not show trash button when onDelete is not provided", () => {
    const { container } = render(<ImageCarousel images={mockImages} />);

    const images = container.querySelectorAll("img");
    fireEvent.click(images[0]);

    expect(screen.queryByLabelText("Delete image")).not.toBeInTheDocument();
  });

  it("calls onDelete with image id when trash button is clicked", () => {
    const onDelete = vi.fn();
    const { container } = render(
      <ImageCarousel images={mockImages} onDelete={onDelete} />,
    );

    const images = container.querySelectorAll("img");
    fireEvent.click(images[0]);

    fireEvent.click(screen.getByLabelText("Delete image"));

    expect(onDelete).toHaveBeenCalledWith("img-1");
  });

  it("shows scan-line overlay when enhancingImageId matches", () => {
    const { container } = render(
      <ImageCarousel images={mockImages} enhancingImageId="img-1" />,
    );

    expect(container.querySelector(".animate-scan-line")).toBeInTheDocument();
  });

  it("hides enhance button on the image being enhanced", () => {
    const onEnhance = vi.fn();
    render(
      <ImageCarousel
        images={mockImages}
        onEnhance={onEnhance}
        enhancingImageId="img-1"
      />,
    );

    // img-1 is being enhanced so its button is hidden, only img-2's button shows
    const enhanceButtons = screen.getAllByLabelText("Enhance this image");
    expect(enhanceButtons).toHaveLength(1);
  });

  it("disables other enhance buttons during enhancement", () => {
    const onEnhance = vi.fn();
    render(
      <ImageCarousel
        images={mockImages}
        onEnhance={onEnhance}
        enhancingImageId="img-1"
      />,
    );

    const enhanceButtons = screen.getAllByLabelText("Enhance this image");
    expect(enhanceButtons[0]).toBeDisabled();
  });

  it("shows arrow navigation buttons on desktop in fullscreen viewer", () => {
    const { container } = render(<ImageCarousel images={mockImages} />);

    const images = container.querySelectorAll("img");
    fireEvent.click(images[0]);

    // First image: no prev button, has next button
    expect(screen.queryByLabelText("Previous image")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Next image")).toBeInTheDocument();
  });
});
