"use client";

import { useState } from "react";
import Link from "next/link";
import { History, RotateCcw } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/app-provider";
import { BOOKING_STATUS_META } from "@/lib/constants";
import { pluralize } from "@/lib/utils";
import { usePagination } from "@/hooks/use-pagination";
import { getBookingForUser } from "@/services/booking.service";
import type { BookingStatus } from "@/types/booking";
import { UserBookingsTable } from "./user-bookings-table";

type HistoryStatus = Extract<BookingStatus, "completed" | "cancelled" | "rejected">;
type HistoryFilter = HistoryStatus | "all";

const HISTORY_STATUSES: HistoryStatus[] = [
  "completed",
  "cancelled",
  "rejected",
];

const HISTORY_OPTIONS: { value: HistoryFilter; label: string }[] = [
  { value: "all", label: "All history" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

export function BookingHistoryPage() {
  const { bookings, resources, currentUser } = useApp();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<HistoryFilter>("all");

  const historyBookings = getBookingForUser(bookings, currentUser.id).filter(
    (booking) =>
      booking.status === "completed" ||
      booking.status === "cancelled" ||
      booking.status === "rejected",
  );
  const normalizedSearch = search.trim().toLowerCase();

  const filteredBookings = historyBookings.filter((booking) => {
    if (status !== "all" && booking.status !== status) return false;
    if (!normalizedSearch) return true;
    const resource = resources.find(
      (item) => item.id === booking.resourceId,
    );
    return [
      booking.bookingReference,
      booking.purpose,
      resource?.name ?? "",
      resource?.assetTag ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const pagination = usePagination(filteredBookings, 8);

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    pagination.setPage(1);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Booking history"
        title="Past requests and returns"
        description="A permanent record of completed, cancelled, and declined bookings."
        actions={
          <Button asChild>
            <Link href="/bookings/new">
              <RotateCcw className="size-4" />
              Book again
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            pagination.setPage(1);
          }}
          placeholder="Search past bookings"
          ariaLabel="Search booking history"
          className="flex-1"
        />
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as HistoryFilter);
            pagination.setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-44" aria-label="Filter history by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HISTORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span>{pluralize(filteredBookings.length, "record")}</span>
        {HISTORY_STATUSES.map((historyStatus) => (
          <span
            key={historyStatus}
            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-500"
          >
            {BOOKING_STATUS_META[historyStatus].label}:{" "}
            {historyBookings.filter(
              (booking) => booking.status === historyStatus,
            ).length}
          </span>
        ))}
      </div>

      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={History}
          title="No history yet"
          description={
            historyBookings.length === 0
              ? "Completed and closed bookings will be archived here once your equipment is returned."
              : "No records match these filters. Try a different search or status."
          }
          action={
            historyBookings.length === 0 ? (
              <Button asChild>
                <Link href="/my-bookings">View active bookings</Link>
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={resetFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-white">
          <UserBookingsTable
            bookings={pagination.pageItems}
            resources={resources}
          />
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
    </div>
  );
}
