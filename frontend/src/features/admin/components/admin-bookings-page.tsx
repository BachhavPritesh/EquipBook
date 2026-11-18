"use client";

import { useState } from "react";
import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import {
  CalendarDays,
  ClipboardList,
  Download,
  Eye,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { ResourceImage } from "@/components/shared/resource-image";
import { SearchInput } from "@/components/shared/search-input";
import { BookingStatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
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
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_META,
} from "@/lib/constants";
import {
  formatDateRange,
  formatDateTime,
  formatTimeRange,
  getTodayKey,
  pluralize,
} from "@/lib/utils";
import { usePagination } from "@/hooks/use-pagination";
import type { Booking, BookingStatus } from "@/types/booking";
import { AdminBookingDetailsDialog } from "./admin-booking-details-dialog";
import { exportBookingsToCsv } from "../utils/export-bookings";

type StatusFilter = BookingStatus | "all";
type ScopeFilter = "all" | "upcoming" | "past";
type SortOption = "newest" | "oldest" | "start-date";

export function AdminBookingsPage({ initialSearch = "" }: { initialSearch?: string }) {
  const { bookings, resources, users } = useApp();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [scope, setScope] = useState<ScopeFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [detailTarget, setDetailTarget] = useState<Booking | null>(null);

  const today = getTodayKey();
  const normalizedSearch = search.trim().toLowerCase();

  const filteredBookings = bookings
    .filter((booking) => {
      if (status !== "all" && booking.status !== status) return false;
      if (scope === "upcoming" && booking.endDate < today) return false;
      if (scope === "past" && booking.endDate >= today) return false;
      if (!normalizedSearch) return true;
      const resource = resources.find(
        (item) => item.id === booking.resourceId,
      );
      const user = users.find((item) => item.id === booking.userId);
      return [
        booking.bookingReference,
        booking.purpose,
        resource?.name ?? "",
        resource?.assetTag ?? "",
        user?.name ?? "",
        user?.email ?? "",
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

  const pagination = usePagination(filteredBookings, 10);

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setScope("all");
    setSort("newest");
    pagination.setPage(1);
  };

  const handleExport = () => {
    if (filteredBookings.length === 0) {
      toast.error("There are no bookings to export.");
      return;
    }
    exportBookingsToCsv(filteredBookings, resources, users);
    toast.success(
      `${pluralize(filteredBookings.length, "booking")} exported to CSV.`,
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="All bookings"
        description="Search, review, and export every reservation across the workspace."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/requests">
                <ClipboardList className="size-4" />
                Review requests
              </Link>
            </Button>
            <Button type="button" onClick={handleExport}>
              <Download className="size-4" />
              Export CSV
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-500">
          {pluralize(bookings.length, "total booking")}
        </span>
        {BOOKING_STATUSES.map((bookingStatus) => (
          <span
            key={bookingStatus}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-500"
          >
            {BOOKING_STATUS_META[bookingStatus].label}:{" "}
            {bookings.filter((booking) => booking.status === bookingStatus).length}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-3 xl:flex-row xl:items-center">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            pagination.setPage(1);
          }}
          placeholder="Search by reference, requester, resource, or purpose"
          ariaLabel="Search all bookings"
          className="flex-1"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter);
              pagination.setPage(1);
            }}
          >
            <SelectTrigger aria-label="Filter bookings by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {BOOKING_STATUSES.map((bookingStatus) => (
                <SelectItem key={bookingStatus} value={bookingStatus}>
                  {BOOKING_STATUS_META[bookingStatus].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={scope}
            onValueChange={(value) => {
              setScope(value as ScopeFilter);
              pagination.setPage(1);
            }}
          >
            <SelectTrigger aria-label="Filter bookings by date scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dates</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value as SortOption);
              pagination.setPage(1);
            }}
          >
            <SelectTrigger aria-label="Sort bookings">
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

      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <Filter className="size-3" />
        {pluralize(filteredBookings.length, "booking")} in view
      </p>

      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No bookings match"
          description="Try a different search, status, or date scope."
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
                <TableHead className="w-[16%]">Booking</TableHead>
                <TableHead className="w-[16%]">Requester</TableHead>
                <TableHead className="w-[23%]">Resource</TableHead>
                <TableHead className="w-[14%]">Dates</TableHead>
                <TableHead className="w-[12%]">Time</TableHead>
                <TableHead className="w-[6%]">Qty</TableHead>
                <TableHead className="w-[9%]">Status</TableHead>
                <TableHead className="w-[8%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageItems.map((booking) => {
                const resource = resources.find(
                  (item) => item.id === booking.resourceId,
                );
                const user = users.find(
                  (item) => item.id === booking.userId,
                );
                const age = Math.max(
                  0,
                  differenceInCalendarDays(
                    new Date(),
                    new Date(booking.createdAt),
                  ),
                );

                return (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <p className="font-mono text-[11px] font-semibold text-indigo-700">
                        {booking.bookingReference}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {age === 0 ? "Today" : `${age}d ago`} ·{" "}
                        {formatDateTime(booking.createdAt)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user ? (
                          <UserAvatar user={user} className="size-7" />
                        ) : null}
                        <div className="min-w-0">
                          <p className="max-w-40 truncate text-[12px] font-medium text-slate-800">
                            {user?.name ?? "Unknown user"}
                          </p>
                          <p className="max-w-40 truncate text-[10px] text-slate-400">
                            {user?.department ?? "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ResourceImage
                          src={resource?.image}
                          alt={resource?.name ?? "Resource"}
                          assetTag={resource?.assetTag}
                          className="size-8 shrink-0 rounded-md"
                          sizes="32px"
                        />
                        <div className="min-w-0">
                          <p className="max-w-44 truncate text-[12px] font-medium text-slate-800">
                            {resource?.name ?? "Resource removed"}
                          </p>
                          <p className="truncate font-mono text-[9px] text-slate-400">
                            {resource?.assetTag ?? "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[11px]">
                      {formatDateRange(booking.startDate, booking.endDate)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-[11px]">
                      {formatTimeRange(booking.startTime, booking.endTime)}
                    </TableCell>
                    <TableCell className="text-[12px] tabular">
                      {booking.quantity}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDetailTarget(booking)}
                        aria-label={`View ${booking.bookingReference}`}
                      >
                        <Eye className="size-4" />
                      </Button>
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
            itemLabel="bookings"
            className="mx-4 mb-4 mt-1"
          />
        </div>
      )}

      {detailTarget ? (
        <AdminBookingDetailsDialog
          booking={detailTarget}
          open={Boolean(detailTarget)}
          onOpenChange={(open) => {
            if (!open) setDetailTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}
