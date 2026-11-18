import Link from "next/link";
import { ArrowRight, History } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { BookingStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BOOKING_STATUS_META } from "@/lib/constants";
import { formatDate, formatTimeRange } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import type { Resource } from "@/types/resource";
import { cn } from "@/lib/utils";

export function RecentActivityCard({
  bookings,
  resources,
}: {
  bookings: Booking[];
  resources: Resource[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <p className="text-[12px] text-slate-500">
          The latest updates on your requests.
        </p>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <EmptyState
            icon={History}
            title="No activity yet"
            description="Your booking updates will appear here."
            className="border-0 bg-slate-50/50 py-8"
          />
        ) : (
          <ol className="space-y-4">
            {bookings.map((booking) => {
              const resource = resources.find(
                (item) => item.id === booking.resourceId,
              );
              const meta = BOOKING_STATUS_META[booking.status];
              return (
                <li key={booking.id} className="relative flex gap-3">
                  <span
                    className={cn(
                      "mt-1 size-2 shrink-0 rounded-full ring-4 ring-white",
                      meta.dotClass,
                    )}
                  />
                  <div className="min-w-0 flex-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[12px] font-medium text-slate-800">
                        {resource?.name ?? "Deleted resource"}
                      </p>
                      <BookingStatusBadge
                        status={booking.status}
                        className="shrink-0 scale-90"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatDate(booking.createdAt)} ·{" "}
                      {formatTimeRange(
                        booking.startTime,
                        booking.endTime,
                      )}
                    </p>
                    <Link
                      href={`/my-bookings/${booking.id}`}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {booking.bookingReference}
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
