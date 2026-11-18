"use client";

import Link from "next/link";
import { PackageOpen } from "lucide-react";

import { ResourceImage } from "@/components/shared/resource-image";
import {
  BookingStatusBadge,
  ConditionBadge,
  ReturnStatusBadge,
} from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/context/app-provider";
import {
  formatDate,
  formatDateRange,
  formatDateTime,
  formatTimeRange,
} from "@/lib/utils";
import { getReturnForBooking } from "@/services/return.service";
import type { Booking } from "@/types/booking";

function DetailLabel({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div className="mt-1 text-[12px] font-medium text-slate-700">{value}</div>
    </div>
  );
}

export function AdminBookingDetailsDialog({
  booking,
  open,
  onOpenChange,
}: {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { resources, users, returns } = useApp();
  const resource = resources.find((item) => item.id === booking.resourceId);
  const user = users.find((item) => item.id === booking.userId);
  const returnRecord = getReturnForBooking(returns, booking.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-base">
            {booking.bookingReference}
          </DialogTitle>
          <DialogDescription>
            Submitted {formatDateTime(booking.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} />
          {returnRecord ? <ReturnStatusBadge record={returnRecord} /> : null}
          {returnRecord?.condition ? (
            <ConditionBadge condition={returnRecord.condition} />
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
              Requester
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              {user ? <UserAvatar user={user} className="size-8" /> : null}
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-slate-800">
                  {user?.name ?? "Unknown user"}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {user?.email ?? "—"}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {user?.department ?? "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
              Resource
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              <ResourceImage
                src={resource?.image}
                alt={resource?.name ?? "Resource"}
                assetTag={resource?.assetTag}
                className="size-9 shrink-0 rounded-md"
                sizes="36px"
              />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-slate-800">
                  {resource?.name ?? "Resource removed"}
                </p>
                <p className="truncate font-mono text-[9px] text-slate-400">
                  {resource?.assetTag ?? "—"}
                </p>
                {resource ? (
                  <Link
                    href={`/resources/${resource.id}`}
                    className="text-[10px] font-medium text-indigo-600 hover:underline"
                  >
                    View resource
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 p-3 sm:grid-cols-4">
          <DetailLabel
            label="Dates"
            value={formatDateRange(booking.startDate, booking.endDate)}
          />
          <DetailLabel
            label="Time"
            value={formatTimeRange(booking.startTime, booking.endTime)}
          />
          <DetailLabel label="Quantity" value={`${booking.quantity}`} />
          <DetailLabel
            label="Location"
            value={resource?.location ?? "—"}
          />
        </dl>

        <div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
            Purpose
          </p>
          <p className="mt-1 text-[12px] leading-6 text-slate-600">
            {booking.purpose}
          </p>
        </div>

        {booking.notes ? (
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
              Requester notes
            </p>
            <p className="mt-1 text-[12px] leading-6 text-slate-600">
              {booking.notes}
            </p>
          </div>
        ) : null}

        {booking.decisionAt ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                Manager decision
              </p>
              <p className="text-[10px] text-slate-400">
                {formatDateTime(booking.decisionAt)}
              </p>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              {booking.adminNotes || "No decision note was added."}
            </p>
          </div>
        ) : null}

        {returnRecord ? (
          <>
            <Separator />
            <div className="space-y-2 text-[11px]">
              <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                Issue & return
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Issued</span>
                <span className="font-medium text-slate-700">
                  {formatDate(returnRecord.issueDate ?? "")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Expected back</span>
                <span className="font-medium text-slate-700">
                  {formatDate(returnRecord.expectedReturnDate)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Returned</span>
                <span className="font-medium text-slate-700">
                  {formatDate(returnRecord.actualReturnDate ?? "")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Units</span>
                <span className="font-medium text-slate-700 tabular">
                  {returnRecord.returnedQuantity} /{" "}
                  {returnRecord.issuedQuantity} returned
                </span>
              </div>
            </div>
          </>
        ) : null}

        {resource ? (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/resources/${resource.id}`}>
              <PackageOpen className="size-4" />
              Open resource page
            </Link>
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
