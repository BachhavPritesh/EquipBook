"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  PackageCheck,
  PackagePlus,
  XCircle,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ResourceImage } from "@/components/shared/resource-image";
import { StatCard } from "@/components/shared/stat-card";
import { BookingStatusBadge, ReturnStatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/app-provider";
import {
  cn,
  formatDateRange,
  formatDateTime,
  formatTimeRange,
  pluralize,
} from "@/lib/utils";
import {
  getRecentBookings,
  getUpcomingBookings,
} from "@/services/booking.service";
import { getUtilizationByCategory } from "@/services/analytics.service";
import { getInventoryStats } from "@/services/resource.service";
import { getOverdueDays, isReturnOverdue } from "@/services/return.service";
import type { Booking } from "@/types/booking";
import {
  BookingDecisionDialog,
  type DecisionMode,
} from "./booking-decision-dialog";

interface DecisionState {
  booking: Booking;
  mode: DecisionMode;
}

export function AdminDashboard() {
  const { bookings, resources, categories, returns, users } = useApp();
  const [decision, setDecision] = useState<DecisionState | null>(null);

  const pending = bookings
    .filter((booking) => booking.status === "pending")
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  const upcoming = getUpcomingBookings(bookings, { limit: 5 });
  const recent = getRecentBookings(bookings, { limit: 5 });
  const inventory = getInventoryStats(resources);
  const utilization = getUtilizationByCategory(resources, categories, bookings);

  const activeReturns = returns.filter((record) => record.status === "issued");
  const itemsOut = activeReturns.reduce(
    (total, record) => total + (record.issuedQuantity - record.returnedQuantity),
    0,
  );
  const overdue = activeReturns.filter((record) => isReturnOverdue(record));
  const overdueRows = overdue.map((record) => {
    const booking = bookings.find((item) => item.id === record.bookingId);
    return {
      record,
      booking,
      resource: resources.find((item) => item.id === booking?.resourceId),
      user: users.find((item) => item.id === booking?.userId),
    };
  });

  const decisionResource = decision
    ? resources.find((item) => item.id === decision.booking.resourceId)
    : undefined;
  const decisionUser = decision
    ? users.find((item) => item.id === decision.booking.userId)
    : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={`Operations · ${format(new Date(), "EEEE, MMMM d")}`}
        title="Operations overview"
        description="A live picture of requests, equipment on loan, and inventory pressure."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/resources">
                <PackagePlus className="size-4" />
                Add resource
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/requests">
                <Clock3 className="size-4" />
                Review requests
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pending requests"
          value={pending.length}
          hint="Waiting for a manager decision"
          icon={Clock3}
          accent="amber"
        />
        <StatCard
          label="Equipment out"
          value={itemsOut}
          hint={`${activeReturns.length} active issue records`}
          icon={PackageCheck}
          accent="indigo"
        />
        <StatCard
          label="Overdue returns"
          value={overdue.length}
          hint="Past their expected return date"
          icon={AlertTriangle}
          accent="rose"
        />
        <StatCard
          label="Available units"
          value={inventory.availableUnits}
          hint={`${inventory.availableUnits} of ${inventory.totalUnits} units`}
          icon={Boxes}
          accent="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Requests waiting for review</CardTitle>
              <p className="text-[12px] text-slate-500">
                Oldest requests appear first.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/requests">
                View queue
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-10 text-center">
                <CheckCircle2 className="size-7 text-emerald-500" />
                <p className="mt-2 text-[13px] font-medium text-slate-700">
                  Queue is clear
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  No booking requests are waiting for review.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pending.slice(0, 4).map((booking) => {
                  const resource = resources.find(
                    (item) => item.id === booking.resourceId,
                  );
                  const user = users.find(
                    (item) => item.id === booking.userId,
                  );
                  return (
                    <li
                      key={booking.id}
                      className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <ResourceImage
                          src={resource?.image}
                          alt={resource?.name ?? "Resource"}
                          assetTag={resource?.assetTag}
                          className="size-10 shrink-0 rounded-lg"
                          sizes="40px"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium text-slate-800">
                            {resource?.name ?? "Resource removed"}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-400">
                            {booking.bookingReference} ·{" "}
                            {formatDateRange(booking.startDate, booking.endDate)}{" "}
                            · {booking.quantity} unit
                            {booking.quantity === 1 ? "" : "s"}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            {user ? (
                              <UserAvatar user={user} className="size-4" />
                            ) : null}
                            <span className="truncate text-[10px] text-slate-400">
                              {user?.name ?? "Unknown requester"} ·{" "}
                              {user?.department ?? "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1.5 sm:pl-3">
                        <Button
                          type="button"
                          variant="success"
                          size="sm"
                          onClick={() =>
                            setDecision({ booking, mode: "approve" })
                          }
                        >
                          <CheckCircle2 className="size-3.5" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() =>
                            setDecision({ booking, mode: "reject" })
                          }
                        >
                          <XCircle className="size-3.5" />
                          Reject
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Inventory health</CardTitle>
              <p className="text-[12px] text-slate-500">
                Stock pressure by category
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/resources">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Available units</span>
                <span className="font-semibold text-slate-800 tabular">
                  {inventory.availableUnits} / {inventory.totalUnits}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/70">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${
                      inventory.totalUnits > 0
                        ? Math.round(
                            (inventory.availableUnits / inventory.totalUnits) *
                              100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>{inventory.fullyBooked} fully booked</span>
                <span>{inventory.maintenance} in maintenance</span>
              </div>
            </div>

            <div className="space-y-3">
              {utilization.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="truncate text-slate-500">{item.name}</span>
                    <span className="text-slate-600 tabular">{item.value}%</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        item.value > 75
                          ? "bg-rose-500"
                          : item.value > 40
                            ? "bg-amber-500"
                            : "bg-indigo-500",
                      )}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Upcoming collections</CardTitle>
              <p className="text-[12px] text-slate-500">
                Approved bookings starting soon.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/bookings">
                All bookings
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-4 text-[12px] text-slate-400">
                No approved bookings are scheduled right now.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcoming.map((booking) => {
                  const resource = resources.find(
                    (item) => item.id === booking.resourceId,
                  );
                  const user = users.find(
                    (item) => item.id === booking.userId,
                  );
                  return (
                    <li
                      key={booking.id}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-8 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                          <span className="text-[9px] uppercase text-slate-400">
                            {format(new Date(`${booking.startDate}T00:00:00`), "MMM")}
                          </span>
                          <span className="text-[12px] font-semibold leading-none text-slate-700 tabular">
                            {format(new Date(`${booking.startDate}T00:00:00`), "d")}
                          </span>
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium text-slate-800">
                            {resource?.name ?? "Resource removed"}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-400">
                            {user?.name ?? "Unknown"} ·{" "}
                            {formatTimeRange(booking.startTime, booking.endTime)}
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/admin/bookings?ref=${booking.bookingReference}`}
                        >
                          View
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Overdue returns</CardTitle>
              <p className="text-[12px] text-slate-500">
                Follow up with borrowers
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/returns">Returns</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {overdueRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 p-4 text-center">
                <CheckCircle2 className="mx-auto size-6 text-emerald-500" />
                <p className="mt-2 text-[12px] font-medium text-slate-700">
                  Nothing overdue
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Every issued item is within its loan window.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {overdueRows.slice(0, 4).map(({ record, booking, resource, user }) => (
                  <li
                    key={record.id}
                    className="rounded-lg border border-rose-100 bg-rose-50/40 p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[11px] font-medium text-slate-700">
                        {resource?.name ?? "Resource"}
                      </p>
                      <ReturnStatusBadge record={record} className="scale-90 origin-right" />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {user?.name ?? "Unknown"} ·{" "}
                      {pluralize(getOverdueDays(record), "day")} overdue
                    </p>
                    {booking ? (
                      <p className="mt-0.5 font-mono text-[9px] text-rose-400">
                        {booking.bookingReference}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Recent bookings</CardTitle>
            <p className="text-[12px] text-slate-500">
              Latest requests across every portal.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/bookings">Open bookings</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0 sm:px-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/60 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-2.5 text-left font-semibold sm:px-6">
                    Reference
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold">Requester</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Resource</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Dates</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                  <th className="px-5 py-2.5 text-right font-semibold sm:px-6">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody>
                {recent.map((booking) => {
                  const resource = resources.find(
                    (item) => item.id === booking.resourceId,
                  );
                  const user = users.find(
                    (item) => item.id === booking.userId,
                  );
                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-5 py-3 sm:px-6">
                        <Link
                          href={`/admin/bookings?ref=${booking.bookingReference}`}
                          className="font-mono text-[10px] font-semibold text-indigo-700 hover:underline"
                        >
                          {booking.bookingReference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-600">
                        {user?.name ?? "Unknown"}
                      </td>
                      <td className="max-w-52 truncate px-4 py-3 text-[11px] text-slate-600">
                        {resource?.name ?? "Resource removed"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-600">
                        {formatDateRange(booking.startDate, booking.endDate)}
                      </td>
                      <td className="px-4 py-3">
                        <BookingStatusBadge status={booking.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-[10px] text-slate-400 sm:px-6">
                        {formatDateTime(booking.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 text-[10px] text-slate-400 sm:px-6">
            Inventory snapshot: {inventory.totalResources} resources ·{" "}
            {inventory.lowStock} low stock ·{" "}
            {inventory.maintenance} maintenance
          </div>
        </CardContent>
      </Card>

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
