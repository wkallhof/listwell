import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageGrid } from "@/components/image-grid";

describe("ImageGrid", () => {
  const defaultProps = {
    previewUrls: [] as string[],
    onAddPhotos: vi.fn(),
    onRemovePhoto: vi.fn(),
  };

  it("renders empty state with add button", () => {
    render(<ImageGrid {...defaultProps} />);

    expect(screen.getByLabelText("Add photo")).toBeInTheDocument();
  });

  it("renders photo previews", () => {
    render(
      <ImageGrid
        {...defaultProps}
        previewUrls={["blob:1", "blob:2"]}
      />,
    );

    expect(screen.getByAltText("Photo 1")).toBeInTheDocument();
    expect(screen.getByAltText("Photo 2")).toBeInTheDocument();
  });

  it("calls onRemovePhoto when remove button clicked", async () => {
    const onRemovePhoto = vi.fn();
    const user = userEvent.setup();

    render(
      <ImageGrid
        {...defaultProps}
        previewUrls={["blob:1"]}
        onRemovePhoto={onRemovePhoto}
      />,
    );

    await user.click(screen.getByLabelText("Remove photo 1"));
    expect(onRemovePhoto).toHaveBeenCalledWith(0);
  });

  it("hides add slot when 5 photos are present", () => {
    render(
      <ImageGrid
        {...defaultProps}
        previewUrls={["blob:1", "blob:2", "blob:3", "blob:4", "blob:5"]}
      />,
    );

    expect(screen.queryByLabelText("Add photo")).not.toBeInTheDocument();
  });

  it("disables Take Photo and Choose from Library when at max", () => {
    render(
      <ImageGrid
        {...defaultProps}
        previewUrls={["blob:1", "blob:2", "blob:3", "blob:4", "blob:5"]}
      />,
    );

    expect(screen.getByText("Take Photo").closest("button")).toBeDisabled();
    expect(
      screen.getByText("Choose from Library").closest("button"),
    ).toBeDisabled();
  });

  it("shows guidance text", () => {
    render(<ImageGrid {...defaultProps} />);

    expect(
      screen.getByText(/Add 3-5 photos from different angles/),
    ).toBeInTheDocument();
  });
});
