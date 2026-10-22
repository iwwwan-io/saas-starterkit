"use client";

import { useMemo, useState } from "react";
import {
  DataGrid,
  DataGridFeatures,
  dataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { useTable, type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/reui/badge";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

export interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "active" | "invited";
  joinedAt: string;
}

interface OrganizationMembersDataGridProps {
  members: OrganizationMember[];
}

export function OrganizationMembersDataGrid({ members }: OrganizationMembersDataGridProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;
    const term = searchTerm.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.role.toLowerCase().includes(term)
    );
  }, [members, searchTerm]);

  const columns = useMemo<ColumnDef<DataGridFeatures, OrganizationMember>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => <DataGridColumnHeader title="Member" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5 py-1">
            <div className="flex size-7 items-center justify-center rounded-full bg-muted font-medium text-xs text-foreground uppercase shrink-0 border border-border/50">
              {row.original.name.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-xs text-foreground truncate">{row.original.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{row.original.email}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: ({ column }) => <DataGridColumnHeader title="Role" column={column} />,
        cell: ({ row }) => {
          const role = row.original.role;
          const variant =
            role === "owner" ? "primary-light" : role === "admin" ? "info-light" : "secondary";
          return (
            <Badge variant={variant} size="xs" className="capitalize">
              {role}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant={status === "active" ? "success-light" : "warning-light"}
              size="xs"
              className="capitalize"
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "joinedAt",
        header: ({ column }) => <DataGridColumnHeader title="Joined" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {row.original.joinedAt}
          </span>
        ),
      },
    ],
    []
  );

  const table = useTable({
    features: dataGridFeatures,
    data: filteredMembers,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 5,
      },
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {filteredMembers.length} {filteredMembers.length === 1 ? "member" : "members"}
        </div>
      </div>

      <div className="rounded-lg border border-border/70 bg-card overflow-hidden">
        <DataGrid table={table} recordCount={filteredMembers.length}>
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Users className="size-8 text-muted-foreground/50" />
              <span>No members found matching your search.</span>
            </div>
          ) : (
            <>
              <DataGridScrollArea>
                <DataGridTable />
              </DataGridScrollArea>
              <div className="p-2 border-t border-border/50 bg-muted/20">
                <DataGridPagination />
              </div>
            </>
          )}
        </DataGrid>
      </div>
    </div>
  );
}
