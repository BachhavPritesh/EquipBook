import Link from "next/link";
import { Eye, XCircle } from "lucide-react";

import { ResourceImage } from "@/components/shared/resource-image";
import { BookingStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDateRange,
  formatDateTime,
  formatTimeRange,
} from "@/lib/utils";
import type { Booking } from "@/types/booking";
import type { Resource } from "@/types/resource";

interface UserBookingsTableProps {
  bookings: Booking[];
  resources: Resource[];
  canCancel?: (booking: Booking) => boolean;
  onCancel?: (booking: Booking) => void;
}

export function UserBookingsTable({
  bookings,
  resources,
  canCancel,
  onCancel,
}: UserBookingsTableProps) {
  return (
    <Table className="min-w-[900px]">
      <TableHeader>
        <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
          <TableHead>Booking</TableHead>
          <TableHead>Resource</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => {
          const resource = resources.find(
            (item) => item.id === booking.resourceId,
          );
          const showCancel = Boolean(onCancel && canCancel?.(booking));

          return (
            <TableRow key={booking.id}>
              <TableCell>
                <Link
                  href={`/my-bookings/${booking.id}`}
                  className="font-mono text-[11px] font-semibold text-indigo-700 hover:underline"
                >
                  {booking.bookingReference}
                </Link>
                <p className="mt-1 max-w-44 truncate text-[11px] text-slate-400">
                  {booking.purpose}
                </p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <ResourceImage
                    src={resource?.image}
                    alt={resource?.name ?? "Resource"}
                    assetTag={resource?.assetTag}
                    className="size-9 shrink-0 rounded-md"
                    sizes="36px"
                  />
                  <div className="min-w-0">
                    <p className="max-w-44 truncate text-[12px] font-medium text-slate-800">
                      {resource?.name ?? "Resource removed"}
                    </p>
                    <p className="mt-0.5 text-[10px] font-mono text-slate-400">
                      {resource?.assetTag ?? "—"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-[12px]">
                {formatDateRange(booking.startDate, booking.endDate)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-[12px]">
                {formatTimeRange(booking.startTime, booking.endTime)}
              </TableCell>
              <TableCell className="text-[12px] tabular">
                {booking.quantity}
              </TableCell>
              <TableCell>
                <BookingStatusBadge status={booking.status} />
                {booking.decisionAt && booking.status !== "pending" ? (
                  <p className="mt-1 text-[10px] text-slate-400">
                    {formatDateTime(booking.decisionAt)}
                  </p>
                ) : null}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`View booking ${booking.bookingReference}`}
                  >
                    <Link href={`/my-bookings/${booking.id}`}>
                      <Eye className="size-4" />
                    </Link>
                  </Button>
                  {showCancel ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => onCancel?.(booking)}
                      aria-label={`Cancel booking ${booking.bookingReference}`}
                    >
                      <XCircle className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
