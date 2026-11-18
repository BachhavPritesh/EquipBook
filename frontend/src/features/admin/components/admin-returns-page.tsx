"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ClipboardCheck,
  PackageCheck,
  RotateCcw,
  Search,
  Undo2,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { ResourceImage } from "@/components/shared/resource-image";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { ReturnStatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApp } from "@/context/app-provider";
import { formatDate, pluralize } from "@/lib/utils";
import { usePagination } from "@/hooks/use-pagination";
import {
  buildReturnRows,
  type ReturnRow,
  type ReturnRowStatus,
} from "../utils/return-rows";
import {
  IssueEquipmentDialogShell,
  RecordReturnDialogShell,
} from "./issue-return-dialogs";

type ReturnFilter = ReturnRowStatus | "all";

const STATUS_OPTIONS: { value: ReturnFilter; label: string }[] = [
  { value: "all", label: "All records" },
  { value: "ready", label: "Ready to issue" },
  { value: "issued", label: "Issued" },
  { value: "overdue", label: "Overdue" },
  { value: "returned", label: "Returned" },
];

function RowStatusBadge({ row }: { row: ReturnRow }) {
  if (row.record) {
    return <ReturnStatusBadge record={row.record} />;
  }
  return (
    <Badge className="border border-blue-200 bg-blue-50 font-medium text-blue-700">
      <span className="size-1.5 rounded-full bg-blue-500" />
      Ready to issue
    </Badge>
  );
}

export function AdminReturnsPage() {
  const { bookings, returns, resources, users } = useApp();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReturnFilter>("all");
  const [issueTarget, setIssueTarget] = useState<ReturnRow | null>(null);
  const [returnTarget, setReturnTarget] = useState<ReturnRow | null>(null);

  const rows = buildReturnRows(bookings, returns, resources, users);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = rows.filter((row) => {
    if (status !== "all" && row.status !== status) return false;
    if (!normalizedSearch) return true;
    return [
      row.booking.bookingReference,
      row.booking.purpose,
      row.resource?.name ?? "",
      row.resource?.assetTag ?? "",
      row.user?.name ?? "",
      row.user?.email ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });
  const pagination = usePagination(filteredRows, 8);

  const readyCount = rows.filter((row) => row.status === "ready").length;
  const issuedCount = rows.filter((row) => row.status === "issued").length;
  const overdueCount = rows.filter((row) => row.status === "overdue").length;
  const returnedCount = rows.filter((row) => row.status === "returned").length;

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    pagination.setPage(1);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Issue & returns"
        description="Hand equipment to approved borrowers, record returns, and track overdue items."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/requests">
              <ClipboardCheck className="size-4" />
              Review requests
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ready to issue"
          value={readyCount}
          hint="Approved bookings awaiting collection"
          icon={PackageCheck}
          accent="blue"
        />
        <StatCard
          label="Currently issued"
          value={issuedCount}
          hint="Equipment out with borrowers"
          icon={RotateCcw}
          accent="indigo"
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          hint="Past the expected return date"
          icon={AlertTriangle}
          accent="rose"
        />
        <StatCard
          label="Returned"
          value={returnedCount}
          hint="Completed issue records"
          icon={Undo2}
          accent="emerald"
        />
      </div>

      <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-[11px] leading-5 text-indigo-700">
        Issue equipment from a ready booking, then record the return when it
        comes back. Returning units immediately increases available stock.
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            pagination.setPage(1);
          }}
          placeholder="Search by reference, borrower, or resource"
          ariaLabel="Search issue and return records"
          className="flex-1"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as ReturnFilter);
            pagination.setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-44" aria-label="Filter by return status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-[11px] text-slate-400">
        {pluralize(filteredRows.length, "record")} in view
      </p>

      {filteredRows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No issue records match"
          description="Try a different search term or status filter."
          action={
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-white">
          <Table className="min-w-[1080px] table-fixed">
            <TableHeader>
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead className="w-[15%]">Booking</TableHead>
                <TableHead className="w-[17%]">Borrower</TableHead>
                <TableHead className="w-[24%]">Resource</TableHead>
                <TableHead className="w-[10%]">Issued</TableHead>
                <TableHead className="w-[10%]">Due</TableHead>
                <TableHead className="w-[10%]">Units</TableHead>
                <TableHead className="w-[8%]">Status</TableHead>
                <TableHead className="w-[8%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageItems.map((row) => {
                const canIssue = row.status === "ready";
                const canReturn =
                  Boolean(row.record) &&
                  (row.status === "issued" || row.status === "overdue");

                return (
                  <TableRow key={row.booking.id}>
                    <TableCell>
                      <p className="font-mono text-[11px] font-semibold text-indigo-700">
                        {row.booking.bookingReference}
                      </p>
                      <p className="mt-1 max-w-40 truncate text-[10px] text-slate-400">
                        {row.booking.purpose}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {row.user ? (
                          <UserAvatar user={row.user} className="size-7" />
                        ) : null}
                        <div className="min-w-0">
                          <p className="max-w-36 truncate text-[12px] font-medium text-slate-800">
                            {row.user?.name ?? "Unknown"}
                          </p>
                          <p className="max-w-36 truncate text-[10px] text-slate-400">
                            {row.user?.department ?? "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ResourceImage
                          src={row.resource?.image}
                          alt={row.resource?.name ?? "Resource"}
                          assetTag={row.resource?.assetTag}
                          className="size-8 shrink-0 rounded-md"
                          sizes="32px"
                        />
                        <div className="min-w-0">
                          <p className="max-w-44 truncate text-[12px] font-medium text-slate-800">
                            {row.resource?.name ?? "Resource removed"}
                          </p>
                          <p className="truncate font-mono text-[9px] text-slate-400">
                            {row.resource?.assetTag ?? "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[11px]">
                      {row.record?.issueDate
                        ? formatDate(row.record.issueDate)
                        : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[11px]">
                      {formatDate(
                        row.record?.expectedReturnDate ??
                          row.booking.endDate,
                      )}
                    </TableCell>
                    <TableCell className="text-[11px]">
                      {row.record ? (
                        <span className="tabular">
                          {row.record.issuedQuantity -
                            row.record.returnedQuantity}{" "}
                          out of {row.record.issuedQuantity}
                        </span>
                      ) : (
                        <span className="tabular">
                          {row.booking.quantity} requested
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <RowStatusBadge row={row} />
                    </TableCell>
                    <TableCell className="text-right">
                      {canIssue ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setIssueTarget(row)}
                        >
                          <PackageCheck className="size-3.5" />
                          Issue
                        </Button>
                      ) : canReturn ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="success"
                          onClick={() => setReturnTarget(row)}
                        >
                          <RotateCcw className="size-3.5" />
                          Return
                        </Button>
                      ) : (
                        <span className="text-[10px] text-slate-300">Closed</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            itemLabel="records"
            className="mx-4 mb-4 mt-1"
          />
        </div>
      )}

      <IssueEquipmentDialogShell
        row={issueTarget}
        open={Boolean(issueTarget)}
        onOpenChange={(open) => {
          if (!open) setIssueTarget(null);
        }}
      />
      <RecordReturnDialogShell
        row={returnTarget}
        open={Boolean(returnTarget)}
        onOpenChange={(open) => {
          if (!open) setReturnTarget(null);
        }}
      />
    </div>
  );
}
