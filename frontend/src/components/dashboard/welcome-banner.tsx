import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  Compass,
  PackageCheck,
} from "lucide-react";

import { ResourceImage } from "@/components/shared/resource-image";
import { BookingStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatTimeRange } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import type { Resource } from "@/types/resource";
import type { User } from "@/types/user";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function WelcomeBanner({
  user,
  nextBooking,
  resource,
  issuedUnits,
}: {
  user: User;
  nextBooking?: Booking;
  resource?: Resource;
  issuedUnits: number;
}) {
  const firstName = user.name.split(" ")[0];

  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-dot-grid opacity-70 lg:block" />
      <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-indigo-600">
            Student workspace · {format(new Date(), "EEEE, MMMM d")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">
            {getGreeting()}, {firstName}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Your next shoot, workshop, or lab session is one reservation away.
            Browse the shared catalogue and keep track of everything you have
            out on loan.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/bookings/new">
                <CalendarPlus className="size-4" />
                New booking
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/resources">
                <Compass className="size-4" />
                Browse resources
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/my-bookings">
                <ClipboardList className="size-4" />
                My bookings
              </Link>
            </Button>
          </div>

          {issuedUnits > 0 ? (
            <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
              <PackageCheck className="size-4" />
              {issuedUnits} item{issuedUnits === 1 ? "" : "s"} currently issued
              to you
            </div>
          ) : null}
        </div>

        {nextBooking && resource ? (
          <div className="relative rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4">
            <span className="absolute -left-2 top-1/2 size-4 -translate-y-1/2 rounded-full border border-slate-200 bg-background" />
            <span className="absolute -right-2 top-1/2 size-4 -translate-y-1/2 rounded-full border border-slate-200 bg-background" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-indigo-500">
                  Next reservation
                </p>
                <p className="mt-1 font-mono text-[11px] text-slate-500">
                  {nextBooking.bookingReference}
                </p>
              </div>
              <BookingStatusBadge status={nextBooking.status} />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ResourceImage
                src={resource.image}
                alt={resource.name}
                assetTag={resource.assetTag}
                className="size-14 shrink-0 rounded-lg border border-white shadow-sm"
                sizes="56px"
              />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900">
                  {resource.name}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {format(parseISO(nextBooking.startDate), "MMM d")}–
                  {format(parseISO(nextBooking.endDate), "d")} ·{" "}
                  {formatTimeRange(
                    nextBooking.startTime,
                    nextBooking.endTime,
                  )}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {resource.location} · {nextBooking.quantity} unit
                  {nextBooking.quantity === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full bg-white">
              <Link href={`/my-bookings/${nextBooking.id}`}>
                View reservation
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-start rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4">
            <CalendarDays className="size-5 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-900">
              No upcoming bookings
            </p>
            <p className="mt-1 text-[12px] leading-5 text-slate-500">
              When you reserve equipment, your next collection will appear
              here.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link href="/resources">Find a resource</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
