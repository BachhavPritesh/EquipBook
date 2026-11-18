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
  CalendarCheck2,
  CalendarDays,
  ClipboardCheck,
  Clock3,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { BookingStatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
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

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function isActiveBooking(booking: Booking): boolean {
  return booking.status === "approved" || booking.status === "pending";
}

export function AdminCalendarPage() {
  const { bookings, resources, categories, users } = useApp();
  const [categoryId, setCategoryId] = useState("all");
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(new Date());

  const filteredResources = resources.filter(
    (resource) => categoryId === "all" || resource.categoryId === categoryId,
  );
  const totalUnits = filteredResources.reduce(
    (total, resource) => total + resource.totalQuantity,
    0,
  );
  const resourceIds = new Set(filteredResources.map((resource) => resource.id));

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthStartKey = format(monthStart, "yyyy-MM-dd");
  const monthEndKey = format(monthEnd, "yyyy-MM-dd");

  const monthBookings = bookings
    .filter(
      (booking) =>
        resourceIds.has(booking.resourceId) &&
        isActiveBooking(booking) &&
        booking.startDate <= monthEndKey &&
        booking.endDate >= monthStartKey,
    )
    .sort(
      (a, b) =>
        new Date(`${a.startDate}T${a.startTime}`).getTime() -
        new Date(`${b.startDate}T${b.startTime}`).getTime(),
    );

  const selectedKey = format(selectedDay, "yyyy-MM-dd");
  const selectedBookings = bookings
    .filter(
      (booking) =>
        resourceIds.has(booking.resourceId) &&
        isActiveBooking(booking) &&
        booking.startDate <= selectedKey &&
        booking.endDate >= selectedKey,
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const selectedUnits = selectedBookings.reduce(
    (total, booking) => total + booking.quantity,
    0,
  );
  const selectedUtilization =
    totalUnits > 0 ? Math.min(100, Math.round((selectedUnits / totalUnits) * 100)) : 0;

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  });

  const changeMonth = (offset: number) => {
    const nextMonth =
      offset > 0 ? addMonths(month, offset) : subMonths(month, -offset);
    setMonth(startOfMonth(nextMonth));
    setSelectedDay(startOfMonth(nextMonth));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Booking calendar"
        description="See how reservations cluster across the month and spot capacity pressure before it becomes a problem."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/requests">
                <ClipboardCheck className="size-4" />
                Review requests
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/bookings">All bookings</Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Scheduled this month"
          value={monthBookings.filter((booking) => booking.status === "approved").length}
          hint={`${format(month, "MMMM yyyy")}`}
          icon={CalendarCheck2}
          accent="indigo"
        />
        <StatCard
          label="Pending this month"
          value={monthBookings.filter((booking) => booking.status === "pending").length}
          hint="Requests still waiting for a decision"
          icon={Clock3}
          accent="amber"
        />
        <StatCard
          label="Selected day usage"
          value={`${selectedUtilization}%`}
          hint={`${selectedUnits} of ${totalUnits} units committed`}
          icon={CalendarDays}
          accent="blue"
        />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-white p-3 sm:flex-row sm:items-center">
        <p className="text-[11px] text-slate-500">
          {filteredResources.length} resources · {totalUnits} units
        </p>
        <Select
          value={categoryId}
          onValueChange={(value) => setCategoryId(value)}
        >
          <SelectTrigger className="sm:ml-auto sm:w-52" aria-label="Filter calendar by category">
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
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>{format(month, "MMMM yyyy")}</CardTitle>
              <p className="mt-1 text-[12px] text-slate-500">
                Active holds by day across all resources
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
                const key = format(day, "yyyy-MM-dd");
                const dayBookings = bookings.filter(
                  (booking) =>
                    resourceIds.has(booking.resourceId) &&
                    isActiveBooking(booking) &&
                    booking.startDate <= key &&
                    booking.endDate >= key,
                );
                const units = dayBookings.reduce(
                  (total, booking) => total + booking.quantity,
                  0,
                );
                const utilization =
                  totalUnits > 0
                    ? Math.min(100, Math.round((units / totalUnits) * 100))
                    : 0;
                const selected = isSameDay(day, selectedDay);
                const inMonth = isSameMonth(day, month);
                const tone =
                  dayBookings.length === 0
                    ? { dot: "bg-emerald-500", text: "text-emerald-700", label: "Open" }
                    : utilization > 75
                      ? { dot: "bg-rose-500", text: "text-rose-600", label: `${utilization}%` }
                      : utilization > 35
                        ? { dot: "bg-amber-500", text: "text-amber-700", label: `${utilization}%` }
                        : { dot: "bg-indigo-500", text: "text-indigo-700", label: `${utilization}%` };

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    aria-label={`${format(day, "MMMM d, yyyy")}: ${tone.label} capacity used`}
                    aria-pressed={selected}
                    className={cn(
                      "flex min-h-14 flex-col rounded-lg border p-1.5 text-left transition-colors sm:min-h-16",
                      inMonth
                        ? "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"
                        : "border-transparent bg-slate-50/60 text-slate-300",
                      selected &&
                        "border-indigo-300 bg-indigo-50/60 ring-2 ring-indigo-100",
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
                      <span className={cn("size-1.5 rounded-full", tone.dot)} />
                    </div>
                    <span
                      className={cn(
                        "mt-auto hidden text-[9px] font-medium sm:block",
                        inMonth ? tone.text : "text-slate-300",
                      )}
                    >
                      {dayBookings.length > 0
                        ? `${dayBookings.length} hold${dayBookings.length === 1 ? "" : "s"}`
                        : "Open"}
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
                <span className="size-1.5 rounded-full bg-indigo-500" /> Light
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-500" /> Busy
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-rose-500" /> Near
                capacity
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Capacity used</span>
                <span className="font-semibold text-slate-800 tabular">
                  {selectedUtilization}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-full rounded-full",
                    selectedUtilization > 75
                      ? "bg-rose-500"
                      : selectedUtilization > 35
                        ? "bg-amber-500"
                        : "bg-indigo-500",
                  )}
                  style={{ width: `${selectedUtilization}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] text-slate-400">
                {selectedUnits} units committed across{" "}
                {selectedBookings.length} booking
                {selectedBookings.length === 1 ? "" : "s"}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Scheduled holds
              </p>
              {selectedBookings.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed border-slate-200 p-3 text-[12px] text-slate-500">
                  No bookings on this day. All units are free.
                </p>
              ) : (
                <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
                  {selectedBookings.map((booking) => {
                    const resource = resources.find(
                      (item) => item.id === booking.resourceId,
                    );
                    const user = users.find(
                      (item) => item.id === booking.userId,
                    );
                    return (
                      <li
                        key={booking.id}
                        className="rounded-lg border border-slate-200 p-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">
                            {resource?.name ?? "Resource removed"}
                          </p>
                          <BookingStatusBadge
                            status={booking.status}
                            className="scale-90 origin-right"
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {formatTimeRange(booking.startTime, booking.endTime)} ·{" "}
                          {booking.quantity} unit
                          {booking.quantity === 1 ? "" : "s"}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            {user ? (
                              <UserAvatar user={user} className="size-5" />
                            ) : null}
                            <span className="truncate text-[10px] text-slate-400">
                              {user?.name ?? "Unknown"}
                            </span>
                          </div>
                          <Link
                            href={`/admin/bookings?ref=${booking.bookingReference}`}
                            className="shrink-0 text-[10px] font-medium text-indigo-600 hover:underline"
                          >
                            View
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
