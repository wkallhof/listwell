"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { userColumns, type UserRow } from "./columns";

interface UsersListClientProps {
  users: UserRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  initialSearch: string;
  currentSortBy: string;
  currentSortOrder: string;
}

export function UsersListClient({
  users,
  pagination,
  initialSearch,
  currentSortBy,
  currentSortOrder,
}: UsersListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(initialSearch);

  const navigate = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(overrides)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`/users?${params.toString()}`);
    },
    [router, searchParams],
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ search: searchValue, page: "1" });
  }

  function handlePageChange(page: number) {
    navigate({ page: String(page) });
  }

  function handleSort(field: string) {
    const newOrder =
      currentSortBy === field && currentSortOrder === "asc" ? "desc" : "asc";
    navigate({ sortBy: field, sortOrder: newOrder, page: "1" });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative max-w-sm flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            placeholder="Search by name or email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
        <button type="button" onClick={() => handleSort("name")} className="text-xs text-muted-foreground hover:text-foreground px-2">
          Sort: {currentSortBy === "name" ? `Name ${currentSortOrder === "asc" ? "↑" : "↓"}` : "Name"}
        </button>
        <button type="button" onClick={() => handleSort("createdAt")} className="text-xs text-muted-foreground hover:text-foreground px-2">
          Sort: {currentSortBy === "createdAt" ? `Date ${currentSortOrder === "asc" ? "↑" : "↓"}` : "Date"}
        </button>
      </form>

      <DataTable
        columns={userColumns}
        data={users}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
