"use client";

import Link from "next/link";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  Package,
  PackageOpen,
  Wrench,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ResourceImage } from "@/components/shared/resource-image";
import {
  ResourceAvailabilityBadge,
} from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/app-provider";
import { cn } from "@/lib/utils";
import { isResourceBookable } from "@/services/resource.service";
import { ResourceCard } from "./resource-card";

export function ResourceDetails({ resourceId }: { resourceId: string }) {
  const { resources, categories, bookings } = useApp();
  const resource = resources.find((item) => item.id === resourceId);

  if (!resource) {
    return (
      <div className="space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/resources">
            <ArrowLeft className="size-4" />
            Back to catalogue
          </Link>
        </Button>
        <EmptyState
          icon={PackageOpen}
          title="Resource not found"
          description="This resource may have been removed from the inventory or the link is out of date."
          action={
            <Button asChild>
              <Link href="/resources">Browse the catalogue</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const category = categories.find((item) => item.id === resource.categoryId);
  const related = resources
    .filter(
      (item) =>
        item.id !== resource.id && item.categoryId === resource.categoryId,
    )
    .slice(0, 3);
  const bookable = isResourceBookable(resource);
  const today = startOfDay(new Date());
  const availabilityDays = Array.from({ length: 14 }, (_, index) =>
    addDays(today, index),
  );

  const getDayReservations = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    return bookings.filter(
      (booking) =>
        booking.resourceId === resource.id &&
        (booking.status === "approved" || booking.status === "pending") &&
        booking.startDate <= key &&
        booking.endDate >= key,
    );
  };

  const availablePercent =
    resource.totalQuantity > 0
      ? Math.round(
          (resource.availableQuantity / resource.totalQuantity) * 100,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/resources">
            <ArrowLeft className="size-4" />
            Back to catalogue
          </Link>
        </Button>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
          {resource.assetTag}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="relative aspect-[16/9] sm:aspect-[2/1]">
              <ResourceImage
                src={resource.image}
                alt={resource.name}
                assetTag={resource.assetTag}
                className="size-full"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
              <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
                <span className="rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur">
                  {category?.name ?? "Uncategorised"}
                </span>
                <ResourceAvailabilityBadge
                  resource={resource}
                  className="shadow-sm"
                />
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {resource.location}
                </span>
                <span className="size-1 rounded-full bg-slate-300" />
                <span className="font-mono uppercase tracking-[0.12em]">
                  {resource.assetTag}
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {resource.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                {resource.description}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Available
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 tabular">
                    {resource.availableQuantity}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Total units
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 tabular">
                    {resource.totalQuantity}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Category
                  </p>
                  <p className="mt-1 truncate text-[12px] font-medium text-slate-800">
                    {category?.name ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Location
                  </p>
                  <p className="mt-1 truncate text-[12px] font-medium text-slate-800">
                    {resource.location}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Next 14 days</CardTitle>
              <p className="text-sm text-slate-500">
                Scheduled holds for this resource. Availability is confirmed
                when a manager approves your request.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {availabilityDays.map((day) => {
                  const reservations = getDayReservations(day);
                  const reservedUnits = reservations.reduce(
                    (total, booking) => total + booking.quantity,
                    0,
                  );
                  const isToday = isSameDay(day, today);
                  return (
                    <div
                      key={format(day, "yyyy-MM-dd")}
                      className={cn(
                        "rounded-lg border p-2.5",
                        isToday
                          ? "border-indigo-200 bg-indigo-50/60"
                          : reservedUnits > 0
                            ? "border-amber-100 bg-amber-50/40"
                            : "border-slate-200 bg-white",
                      )}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        {format(day, "EEE")}
                      </p>
                      <p className="mt-0.5 text-lg font-semibold leading-none text-slate-900 tabular">
                        {format(day, "d")}
                      </p>
                      <p
                        className={cn(
                          "mt-2 text-[10px] font-medium",
                          reservedUnits > 0
                            ? "text-amber-700"
                            : "text-emerald-600",
                        )}
                      >
                        {reservedUnits > 0
                          ? `${reservedUnits} unit${reservedUnits === 1 ? "" : "s"} held`
                          : "Open"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="size-4 text-indigo-600" />
                  Usage instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-slate-500">
                  {resource.instructions}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="size-4 text-indigo-600" />
                  Booking requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {resource.requirements.map((requirement) => (
                    <li
                      key={requirement}
                      className="flex items-start gap-2 text-sm leading-6 text-slate-500"
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      {requirement}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  Reservation
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Plan your booking
                </p>
              </div>
              <CardContent className="space-y-4 pt-5">
                <div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-slate-500">Availability</span>
                    <span className="font-medium text-slate-800 tabular">
                      {resource.availableQuantity} / {resource.totalQuantity}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        availablePercent > 50
                          ? "bg-emerald-500"
                          : availablePercent > 20
                            ? "bg-amber-500"
                            : "bg-rose-500",
                      )}
                      style={{ width: `${availablePercent}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[12px] font-medium text-slate-700">
                      Flexible dates
                    </p>
                    <p className="mt-0.5 text-[11px] leading-5 text-slate-400">
                      Pick your range in the booking form and we will check
                      availability before you submit.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <Package className="mt-0.5 size-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[12px] font-medium text-slate-700">
                      Collect from {resource.location}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-5 text-slate-400">
                      Bring your university ID. Collection details are included
                      in your approval note.
                    </p>
                  </div>
                </div>
                {bookable ? (
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/bookings/new?resourceId=${resource.id}`}>
                      Book this resource
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" disabled>
                    Currently unavailable
                  </Button>
                )}
                <p className="text-center text-[10px] leading-4 text-slate-400">
                  Requests are reviewed by a resource manager. You will be
                  notified when a decision is made.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="space-y-4 border-t border-slate-200 pt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-indigo-600">
                More in {category?.name}
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Related resources
              </h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/resources">View all</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ResourceCard
                key={item.id}
                resource={item}
                category={category}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
