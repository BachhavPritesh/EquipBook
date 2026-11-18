"use client";

import { useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Package,
  Plus,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { BookingStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/app-provider";
import { cn, formatTimeRange } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import type { Resource } from "@/types/resource";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function isActiveBooking(booking: Booking): boolean {
  return booking.status === "approved" || booking.status === "pending";
}

function getBookingsForDay(
  resource: Resource | undefined,
  bookings: Booking[],
  day: Date,
): Booking[] {
  if (!resource) return [];
  const key = format(day, "yyyy-MM-dd");
  return bookings.filter(
    (booking) =>
      booking.resourceId === resource.id &&
      isActiveBooking(booking) &&
      booking.startDate <= key &&
      booking.endDate >= key,
  );
}

function getDayAvailability(resource: Resource, bookings: Booking[]) {
  const approvedUnits = bookings
    .filter((booking) => booking.status === "approved")
    .reduce((total, booking) => total + booking.quantity, 0);
  const pendingUnits = bookings
    .filter((booking) => booking.status === "pending")
    .reduce((total, booking) => total + booking.quantity, 0);
  const availableUnits = Math.max(
    0,
    resource.availableQuantity - pendingUnits,
  );

  return { approvedUnits, pendingUnits, availableUnits };
}

function getDayTone(
  resource: Resource,
  bookings: Booking[],
): { dotClass: string; textClass: string; label: string } {
  if (resource.status === "maintenance") {
    return {
      dotClass: "bg-amber-500",
      textClass: "text-amber-700",
      label: "Service",
    };
  }
  if (resource.status === "unavailable") {
    return {
      dotClass: "bg-slate-400",
      textClass: "text-slate-500",
      label: "Closed",
    };
  }

  const { availableUnits } = getDayAvailability(resource, bookings);
  if (availableUnits === 0) {
    return {
      dotClass: "bg-rose-500",
      textClass: "text-rose-600",
      label: "Full",
    };
  }
  if (bookings.length > 0) {
    return {
      dotClass: "bg-amber-500",
      textClass: "text-amber-700",
      label: "Partial",
    };
  }
  return {
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700",
    label: "Open",
  };
}

export function AvailabilityPage() {
  const { resources, categories, bookings } = useApp();
  const [categoryId, setCategoryId] = useState("all");
  const [location, setLocation] = useState("all");
  const [resourceId, setResourceId] = useState("");
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(new Date());

  const locations = Array.from(
    new Set(resources.map((resource) => resource.location)),
  ).sort();
  const filteredResources = resources.filter((resource) => {
    const matchesCategory =
      categoryId === "all" || resource.categoryId === categoryId;
    const matchesLocation = location === "all" || resource.location === location;
    return matchesCategory && matchesLocation;
  });
  const selectedResource =
    filteredResources.find((resource) => resource.id === resourceId) ??
    filteredResources[0];

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthStartKey = format(monthStart, "yyyy-MM-dd");
  const monthEndKey = format(monthEnd, "yyyy-MM-dd");

  const monthBookings = selectedResource
    ? bookings.filter(
        (booking) =>
          booking.resourceId === selectedResource.id &&
          isActiveBooking(booking) &&
          booking.startDate <= monthEndKey &&
          booking.endDate >= monthStartKey,
      )
    : [];
  const monthApproved = monthBookings.filter(
    (booking) => booking.status === "approved",
  ).length;
  const monthPending = monthBookings.filter(
    (booking) => booking.status === "pending",
  ).length;

  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const selectedBookings = getBookingsForDay(
    selectedResource,
    bookings,
    selectedDay,
  );
  const selectedAvailability = selectedResource
    ? getDayAvailability(selectedResource, selectedBookings)
    : null;

  const changeMonth = (offset: number) => {
    const nextMonth =
      offset > 0 ? addMonths(month, offset) : subMonths(month, -offset);
    setMonth(startOfMonth(nextMonth));
    setSelectedDay(startOfMonth(nextMonth));
  };

  if (!selectedResource) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Availability"
          title="Resource calendar"
          description="Check day-by-day equipment availability before requesting a booking."
        />
        <EmptyState
          icon={CalendarDays}
          title="No resources match these filters"
          description="Try clearing the category or location filter to see more equipment."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCategoryId("all");
                setLocation("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Availability"
        title="Resource calendar"
        description="Inspect scheduled holds day by day. Availability is checked again when you submit a request."
        actions={
          <Button asChild>
            <Link href={`/bookings/new?resourceId=${selectedResource.id}`}>
              <Plus className="size-4" />
              Book this resource
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-white p-3 sm:flex-row sm:items-center">
        <Select
          value={selectedResource.id}
          onValueChange={(value) => setResourceId(value)}
        >
          <SelectTrigger className="flex-1" aria-label="Choose a resource">
            <SelectValue placeholder="Choose a resource" />
          </SelectTrigger>
          <SelectContent>
            {filteredResources.map((resource) => (
              <SelectItem key={resource.id} value={resource.id}>
                {resource.name} · {resource.assetTag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={categoryId}
          onValueChange={(value) => {
            setCategoryId(value);
            setResourceId("");
          }}
        >
          <SelectTrigger className="sm:w-44" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={location}
          onValueChange={(value) => {
            setLocation(value);
            setResourceId("");
          }}
        >
          <SelectTrigger className="sm:w-48" aria-label="Filter by location">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Available now"
          value={selectedResource.availableQuantity}
          hint={`of ${selectedResource.totalQuantity} total units`}
          icon={Package}
          accent="emerald"
        />
        <StatCard
          label="Scheduled holds"
          value={monthApproved}
          hint={`approved bookings in ${format(month, "MMMM")}`}
          icon={CalendarDays}
          accent="indigo"
        />
        <StatCard
          label="Pending requests"
          value={monthPending}
          hint={`awaiting review in ${format(month, "MMMM")}`}
          icon={Clock3}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>{format(month, "MMMM yyyy")}</CardTitle>
              <p className="mt-1 text-[12px] text-slate-500">
                {selectedResource.name}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => changeMonth(-1)}
                aria-label="Previous month"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setMonth(startOfMonth(new Date()));
                  setSelectedDay(new Date());
                }}
              >
                Today
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => changeMonth(1)}
                aria-label="Next month"
              >
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 border-b border-slate-100 pb-2">
              {WEEKDAYS.map((weekday) => (
                <div
                  key={weekday}
                  className="px-1 text-center text-[10px] font-medium uppercase tracking-wider text-slate-400"
                >
                  {weekday}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dayBookings = getBookingsForDay(
                  selectedResource,
                  bookings,
                  day,
                );
                const tone = getDayTone(selectedResource, dayBookings);
                const selected = isSameDay(day, selectedDay);
                const inMonth = isSameMonth(day, month);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    aria-label={`${format(day, "MMMM d, yyyy")}: ${tone.label}`}
                    aria-pressed={selected}
                    className={cn(
                      "flex min-h-14 flex-col rounded-lg border p-1.5 text-left transition-colors sm:min-h-16",
                      inMonth
                        ? "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"
                        : "border-transparent bg-slate-50/60 text-slate-300",
                      selected && "border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-100",
                      isToday(day) && !selected && "border-indigo-200",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          "text-[12px] font-medium",
                          inMonth ? "text-slate-700" : "text-slate-300",
                          isToday(day) && "text-indigo-700",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <span
                        className={cn("size-1.5 rounded-full", tone.dotClass)}
                      />
                    </div>
                    <span
                      className={cn(
                        "mt-auto hidden text-[9px] font-medium sm:block",
                        inMonth ? tone.textClass : "text-slate-300",
                      )}
                    >
                      {tone.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Open
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-500" /> Partial
                or service
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-rose-500" /> Fully
                booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-slate-400" /> Closed
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-indigo-600">
              {format(selectedDay, "EEEE")}
            </p>
            <CardTitle>{format(selectedDay, "MMMM d, yyyy")}</CardTitle>
            <p className="text-[12px] text-slate-500">
              {selectedResource.name} · {selectedResource.location}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5">
                <p className="text-[9px] font-medium uppercase tracking-wider text-emerald-700">
                  Open
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 tabular">
                  {selectedAvailability?.availableUnits ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-2.5">
                <p className="text-[9px] font-medium uppercase tracking-wider text-blue-700">
                  Approved
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 tabular">
                  {selectedAvailability?.approvedUnits ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-2.5">
                <p className="text-[9px] font-medium uppercase tracking-wider text-amber-700">
                  Pending
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900 tabular">
                  {selectedAvailability?.pendingUnits ?? 0}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Holds on this day
              </p>
              {selectedBookings.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed border-slate-200 p-3 text-[12px] text-slate-500">
                  No holds. The full available stock can be requested.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {selectedBookings.map((booking) => (
                    <li
                      key={booking.id}
                      className="rounded-lg border border-slate-200 p-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-medium text-slate-700">
                          {formatTimeRange(
                            booking.startTime,
                            booking.endTime,
                          )}
                        </span>
                        <BookingStatusBadge
                          status={booking.status}
                          className="scale-90 origin-right"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {booking.quantity} unit
                        {booking.quantity === 1 ? "" : "s"} · Scheduled hold
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button asChild className="w-full">
              <Link href={`/bookings/new?resourceId=${selectedResource.id}`}>
                <Plus className="size-4" />
                Request this resource
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
