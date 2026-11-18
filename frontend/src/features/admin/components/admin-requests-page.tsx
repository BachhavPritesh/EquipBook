"use client";

import { useState } from "react";
import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  XCircle,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { ResourceImage } from "@/components/shared/resource-image";
import { SearchInput } from "@/components/shared/search-input";
import {
  BookingStatusBadge,
  ResourceAvailabilityBadge,
} from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-provider";
import {
  formatDateRange,
  formatDateTime,
  formatTimeRange,
  pluralize,
} from "@/lib/utils";
import { usePagination } from "@/hooks/use-pagination";
import type { Booking } from "@/types/booking";
import {
  BookingDecisionDialog,
  type DecisionMode,
} from "./booking-decision-dialog";

interface DecisionState {
  booking: Booking;
  mode: DecisionMode;
}

export function AdminRequestsPage() {
  const { bookings, resources, users } = useApp();
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState<DecisionState | null>(null);

  const pendingBookings = bookings
    .filter((booking) => booking.status === "pending")
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  const normalizedSearch = search.trim().toLowerCase();
  const filteredRequests = pendingBookings.filter((booking) => {
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
  });
  const pagination = usePagination(filteredRequests, 6);

  const decided = bookings
    .filter(
      (booking) =>
        booking.status === "approved" || booking.status === "rejected",
    )
    .sort(
      (a, b) =>
        new Date(b.decisionAt ?? b.createdAt).getTime() -
        new Date(a.decisionAt ?? a.createdAt).getTime(),
    )
    .slice(0, 4);

  const decisionBooking = decision?.booking;
  const decisionResource = decisionBooking
    ? resources.find((item) => item.id === decisionBooking.resourceId)
    : undefined;
  const decisionUser = decisionBooking
    ? users.find((item) => item.id === decisionBooking.userId)
    : undefined;

  const openDecision = (booking: Booking, mode: DecisionMode) => {
    setDecision({ booking, mode });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Booking requests"
        description="Review incoming requests, check stock, and approve or decline with a note."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/bookings">
              All bookings
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock3 className="size-4" />
            <p className="text-[11px] font-medium uppercase tracking-wider">
              Awaiting review
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular">
            {pendingBookings.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <ClipboardCheck className="size-4" />
            <p className="text-[11px] font-medium uppercase tracking-wider">
              Oldest request
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular">
            {pendingBookings[0]
              ? Math.max(
                  0,
                  differenceInCalendarDays(
                    new Date(),
                    new Date(pendingBookings[0].createdAt),
                  ),
                )
              : 0}
            <span className="ml-1 text-xs font-normal text-slate-400">
              days
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <CheckCircle2 className="size-4" />
            <p className="text-[11px] font-medium uppercase tracking-wider">
              Decided recently
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900 tabular">
            {bookings.filter((booking) => booking.decisionAt).length}
          </p>
        </div>
      </div>

      <SearchInput
        value={search}
        onChange={(value) => {
          setSearch(value);
          pagination.setPage(1);
        }}
        placeholder="Search request by reference, requester, or resource"
        ariaLabel="Search booking requests"
        className="max-w-xl"
      />

      <p className="text-[11px] text-slate-400">
        {pluralize(filteredRequests.length, "pending request")} · oldest first
      </p>

      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={pendingBookings.length === 0 ? "All caught up" : "No matching requests"}
          description={
            pendingBookings.length === 0
              ? "There are no booking requests waiting for review right now."
              : "Try a different search term to find the request."
          }
          action={
            pendingBookings.length === 0 ? (
              <Button asChild variant="outline">
                <Link href="/admin/bookings">View all bookings</Link>
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setSearch("")}>
                Clear search
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {pagination.pageItems.map((booking) => {
            const resource = resources.find(
              (item) => item.id === booking.resourceId,
            );
            const user = users.find((item) => item.id === booking.userId);
            const waitingDays = Math.max(
              0,
              differenceInCalendarDays(
                new Date(),
                new Date(booking.createdAt),
              ),
            );

            return (
              <article
                key={booking.id}
                className="rounded-xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-indigo-700">
                        {booking.bookingReference}
                      </span>
                      <BookingStatusBadge status={booking.status} />
                      <span className="text-[10px] text-slate-400">
                        Requested {formatDateTime(booking.createdAt)} · waiting{" "}
                        {waitingDays === 0 ? "today" : pluralize(waitingDays, "day")}
                      </span>
                    </div>

                    <div className="mt-3 flex items-start gap-3">
                      <ResourceImage
                        src={resource?.image}
                        alt={resource?.name ?? "Resource"}
                        assetTag={resource?.assetTag}
                        className="size-14 shrink-0 rounded-lg"
                        sizes="56px"
                      />
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-slate-900">
                          {resource?.name ?? "Resource removed"}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400">
                          {resource?.assetTag ?? "—"} ·{" "}
                          {resource?.location ?? "Unknown location"}
                        </p>
                        <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-slate-500">
                          {booking.purpose}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-4">
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                          Dates
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-700">
                          {formatDateRange(booking.startDate, booking.endDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                          Time
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-700">
                          {formatTimeRange(booking.startTime, booking.endTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                          Quantity
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-700 tabular">
                          {booking.quantity} unit
                          {booking.quantity === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                          Stock now
                        </p>
                        {resource ? (
                          <ResourceAvailabilityBadge
                            resource={resource}
                            className="mt-0.5 scale-90 origin-left"
                          />
                        ) : (
                          <p className="mt-0.5 text-[11px] text-slate-400">—</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 xl:w-60 xl:border-l xl:border-slate-100 xl:pl-5">
                    <div className="flex items-center gap-2.5">
                      {user ? (
                        <UserAvatar user={user} className="size-8" />
                      ) : null}
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-slate-800">
                          {user?.name ?? "Unknown requester"}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">
                          {user?.department ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        className="flex-1"
                        onClick={() => openDecision(booking, "approve")}
                      >
                        <CheckCircle2 className="size-3.5" />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => openDecision(booking, "reject")}
                      >
                        <XCircle className="size-3.5" />
                        Reject
                      </Button>
                    </div>
                    <p className="text-[10px] leading-4 text-slate-400">
                      Approving reserves stock immediately. You can add a
                      collection note.
                    </p>
                  </div>
                </div>
              </article>
            );
          })}

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            itemLabel="requests"
            className="rounded-xl border border-border bg-white px-4 pb-4"
          />
        </div>
      )}

      {decided.length > 0 ? (
        <section className="space-y-3 border-t border-slate-200 pt-5">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              Recently decided
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Latest approvals and declines across the workspace.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {decided.map((booking) => {
              const resource = resources.find(
                (item) => item.id === booking.resourceId,
              );
              const user = users.find((item) => item.id === booking.userId);
              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-slate-700">
                      {resource?.name ?? "Resource removed"}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      {user?.name ?? "Unknown"} · {booking.bookingReference}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {decision ? (
        <BookingDecisionDialog
          booking={decision.booking}
          resource={decisionResource}
          user={decisionUser}
          mode={decision.mode}
          open={Boolean(decision)}
          onOpenChange={(open) => {
            if (!open) setDecision(null);
          }}
        />
      ) : null}
    </div>
  );
}
