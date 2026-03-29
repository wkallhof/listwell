"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  suspended: boolean;
  createdAt: string;
  creditBalance: number;
  totalListings: number;
}

export const userColumns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/users/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Signed Up",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className="text-muted-foreground">
          {date.toLocaleDateString()}
        </span>
      );
    },
  },
  {
    accessorKey: "creditBalance",
    header: "Credits",
    cell: ({ row }) => (
      <span className="font-mono">{row.original.creditBalance}</span>
    ),
  },
  {
    accessorKey: "totalListings",
    header: "Listings",
    cell: ({ row }) => (
      <span className="font-mono">{row.original.totalListings}</span>
    ),
  },
  {
    accessorKey: "suspended",
    header: "Status",
    cell: ({ row }) =>
      row.original.suspended ? (
        <Badge variant="destructive">Suspended</Badge>
      ) : (
        <Badge variant="secondary">Active</Badge>
      ),
  },
];
