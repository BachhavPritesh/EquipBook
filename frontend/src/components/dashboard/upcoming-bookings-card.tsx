import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ResourceImage } from "@/components/shared/resource-image";
import { BookingStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTimeRange } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import type { Resource } from "@/types/resource";

export function UpcomingBookingsCard({
  bookings,
  resources,
}: {
  bookings: Booking[];
  resources: Resource[];
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Upcoming bookings</CardTitle>
          <p className="mt-1 text-[12px] text-slate-500">
            Approved reservations waiting for collection.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/my-bookings">
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nothing on the calendar"
            description="You have no approved bookings coming up. Browse the catalogue to reserve equipment."
            className="border-0 bg-slate-50/50 py-10"
            action={
              <Button asChild size="sm">
                <Link href="/resources">Browse resources</Link>
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {bookings.map((booking) => {
              const resource = resources.find(
                (item) => item.id === booking.resourceId,
              );
              const start = parseISO(booking.startDate);
              return (
                <div
                  key={booking.id}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                >
                  <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border border-slate-200 bg-slate-50/70 py-1.5">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                      {format(start, "MMM")}
                    </span>
                    <span className="text-lg font-semibold leading-tight text-slate-900 tabular">
                      {format(start, "d")}
                    </span>
                  </div>
                  {resource ? (
                    <ResourceImage
                      src={resource.image}
                      alt={resource.name}
                      assetTag={resource.assetTag}
                      className="hidden size-12 shrink-0 rounded-lg sm:block"
                      sizes="48px"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/my-bookings/${booking.id}`}
                        className="truncate text-[13px] font-semibold text-slate-900 hover:text-indigo-700"
                      >
                        {resource?.name ?? "Deleted resource"}
                      </Link>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span>
                        {formatTimeRange(
                          booking.startTime,
                          booking.endTime,
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3 text-slate-400" />
                        {resource?.location ?? "—"}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400">
                        {booking.bookingReference}
                      </span>
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon-sm"
                    className="self-end sm:self-auto"
                    aria-label={`View booking ${booking.bookingReference}`}
                  >
                    <Link href={`/my-bookings/${booking.id}`}>
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
