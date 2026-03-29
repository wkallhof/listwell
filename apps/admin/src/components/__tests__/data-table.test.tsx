import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../data-table";

interface TestRow {
  id: string;
  name: string;
}

const columns: ColumnDef<TestRow>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
];

const testData: TestRow[] = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
];

describe("DataTable", () => {
  it("renders table with headers and data", () => {
    render(<DataTable columns={columns} data={testData} />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows 'No results' when data is empty", () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("renders pagination controls", () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        pagination={{ page: 1, totalPages: 3, total: 50 }}
      />,
    );
    expect(screen.getByText("50 total results")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("disables previous button on first page", () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        pagination={{ page: 1, totalPages: 3, total: 50 }}
      />,
    );
    const prevButton = screen.getByText("Previous").closest("button");
    expect(prevButton).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(
      <DataTable
        columns={columns}
        data={testData}
        pagination={{ page: 3, totalPages: 3, total: 50 }}
      />,
    );
    const nextButton = screen.getByText("Next").closest("button");
    expect(nextButton).toBeDisabled();
  });

  it("calls onPageChange when clicking next", async () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={testData}
        pagination={{ page: 1, totalPages: 3, total: 50 }}
        onPageChange={onPageChange}
      />,
    );
    await userEvent.click(screen.getByText("Next"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange when clicking previous", async () => {
    const onPageChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={testData}
        pagination={{ page: 2, totalPages: 3, total: 50 }}
        onPageChange={onPageChange}
      />,
    );
    await userEvent.click(screen.getByText("Previous"));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("shows singular 'result' for total of 1", () => {
    render(
      <DataTable
        columns={columns}
        data={testData.slice(0, 1)}
        pagination={{ page: 1, totalPages: 1, total: 1 }}
      />,
    );
    expect(screen.getByText("1 total result")).toBeInTheDocument();
  });
});
