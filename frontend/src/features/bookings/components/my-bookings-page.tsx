"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, Plus } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
import {
  getBookingForUser,
  getCancelEligibility,
} from "@/services/booking.service";
import { getReturnForBooking } from "@/services/return.service";
import type { Booking, BookingStatus } from "@/types/booking";
import { UserBookingsTable } from "./user-bookings-table";

type StatusFilter = BookingStatus | "all";
type SortOption = "newest" | "oldest" | "start-date";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export function MyBookingsPage() {
  const {
    bookings,
    resources,
    returns,
    currentUser,
    cancelBooking,
  } = useApp();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const userBookings = getBookingForUser(bookings, currentUser.id);
  const normalizedSearch = search.trim().toLowerCase();

  const filteredBookings = userBookings
    .filter((booking) => {
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
    })
    .sort((a, b) => {
      if (sort === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (sort === "start-date") {
        return (
          new Date(`${a.startDate}T${a.startTime}`).getTime() -
          new Date(`${b.startDate}T${b.startTime}`).getTime()
        );
      }
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

  const pagination = usePagination(filteredBookings, 8);

  const canCancel = (booking: Booking) => {
    const returnRecord = getReturnForBooking(returns, booking.id);
    return getCancelEligibility(booking, returnRecord).allowed;
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    const result = cancelBooking(cancelTarget.id);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setCancelTarget(null);
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setSort("newest");
    pagination.setPage(1);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="My bookings"
        title="Your reservations"
        description="Track pending requests, manage approved bookings, and keep an eye on collection dates."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/availability">
                <CalendarDays className="size-4" />
                Availability
              </Link>
            </Button>
            <Button asChild>
              <Link href="/bookings/new">
                <Plus className="size-4" />
                New booking
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            pagination.setPage(1);
          }}
          placeholder="Search by reference, resource, or purpose"
          ariaLabel="Search your bookings"
          className="flex-1"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter);
              pagination.setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-40" aria-label="Filter by status">
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
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value as SortOption);
              pagination.setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-44" aria-label="Sort bookings">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="start-date">Start date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        Showing {pluralize(filteredBookings.length, "booking")}
        {status !== "all"
          ? ` · ${BOOKING_STATUS_META[status].label.toLowerCase()}`
          : ""}
      </p>

      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No bookings found"
          description={
            userBookings.length === 0
              ? "You have not requested any equipment yet. Browse the catalogue to make your first booking."
              : "No bookings match these filters. Try a different search or status."
          }
          action={
            userBookings.length === 0 ? (
              <Button asChild>
                <Link href="/resources">Browse resources</Link>
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
            canCancel={canCancel}
            onCancel={setCancelTarget}
          />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            itemLabel="bookings"
            className="mx-4 mb-4 mt-1"
          />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        title="Cancel this booking?"
        description={
          cancelTarget
            ? `${cancelTarget.bookingReference} will be cancelled. Any reserved units are returned to the available pool.`
            : ""
        }
        confirmLabel="Cancel booking"
        destructive
        onConfirm={handleCancel}
      />
    </div>
  );
}
