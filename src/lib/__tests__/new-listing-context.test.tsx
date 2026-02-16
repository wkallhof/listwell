import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewListingProvider, useNewListing } from "@/lib/new-listing-context";

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(globalThis.URL, "createObjectURL", {
  value: mockCreateObjectURL,
  writable: true,
});
Object.defineProperty(globalThis.URL, "revokeObjectURL", {
  value: mockRevokeObjectURL,
  writable: true,
});

beforeEach(() => {
  mockCreateObjectURL.mockReset();
  mockRevokeObjectURL.mockReset();
  mockCreateObjectURL.mockImplementation(
    () => `blob:http://localhost/${Math.random()}`,
  );
});

function TestConsumer() {
  const {
    photos,
    previewUrls,
    description,
    addPhotos,
    removePhoto,
    setDescription,
    reset,
  } = useNewListing();

  return (
    <div>
      <p data-testid="photo-count">{photos.length}</p>
      <p data-testid="preview-count">{previewUrls.length}</p>
      <p data-testid="description">{description}</p>
      <button onClick={() => addPhotos([new File(["a"], "test.jpg", { type: "image/jpeg" })])}>
        Add Photo
      </button>
      <button onClick={() => removePhoto(0)}>Remove First</button>
      <button onClick={() => setDescription("test description")}>Set Desc</button>
      <button onClick={() => reset()}>Reset</button>
    </div>
  );
}

describe("NewListingContext", () => {
  it("provides initial empty state", () => {
    render(
      <NewListingProvider>
        <TestConsumer />
      </NewListingProvider>,
    );

    expect(screen.getByTestId("photo-count")).toHaveTextContent("0");
    expect(screen.getByTestId("preview-count")).toHaveTextContent("0");
    expect(screen.getByTestId("description")).toHaveTextContent("");
  });

  it("adds photos and creates preview URLs", async () => {
    const user = userEvent.setup();

    render(
      <NewListingProvider>
        <TestConsumer />
      </NewListingProvider>,
    );

    await user.click(screen.getByText("Add Photo"));

    expect(screen.getByTestId("photo-count")).toHaveTextContent("1");
    expect(screen.getByTestId("preview-count")).toHaveTextContent("1");
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
  });

  it("limits photos to 5", async () => {
    const user = userEvent.setup();

    function BulkAdd() {
      const { photos, addPhotos } = useNewListing();
      return (
        <div>
          <p data-testid="count">{photos.length}</p>
          <button
            onClick={() =>
              addPhotos(
                Array.from({ length: 6 }, (_, i) =>
                  new File(["x"], `photo${i}.jpg`, { type: "image/jpeg" }),
                ),
              )
            }
          >
            Add 6
          </button>
        </div>
      );
    }

    render(
      <NewListingProvider>
        <BulkAdd />
      </NewListingProvider>,
    );

    await user.click(screen.getByText("Add 6"));
    expect(screen.getByTestId("count")).toHaveTextContent("5");
  });

  it("removes a photo and revokes its URL", async () => {
    const user = userEvent.setup();

    render(
      <NewListingProvider>
        <TestConsumer />
      </NewListingProvider>,
    );

    await user.click(screen.getByText("Add Photo"));
    expect(screen.getByTestId("photo-count")).toHaveTextContent("1");

    await user.click(screen.getByText("Remove First"));
    expect(screen.getByTestId("photo-count")).toHaveTextContent("0");
    expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it("sets description", async () => {
    const user = userEvent.setup();

    render(
      <NewListingProvider>
        <TestConsumer />
      </NewListingProvider>,
    );

    await user.click(screen.getByText("Set Desc"));
    expect(screen.getByTestId("description")).toHaveTextContent("test description");
  });

  it("resets all state", async () => {
    const user = userEvent.setup();

    render(
      <NewListingProvider>
        <TestConsumer />
      </NewListingProvider>,
    );

    await user.click(screen.getByText("Add Photo"));
    await user.click(screen.getByText("Set Desc"));
    expect(screen.getByTestId("photo-count")).toHaveTextContent("1");
    expect(screen.getByTestId("description")).toHaveTextContent("test description");

    await user.click(screen.getByText("Reset"));
    expect(screen.getByTestId("photo-count")).toHaveTextContent("0");
    expect(screen.getByTestId("description")).toHaveTextContent("");
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it("throws when used outside provider", () => {
    expect(() => render(<TestConsumer />)).toThrow(
      "useNewListing must be used within NewListingProvider",
    );
  });
});
