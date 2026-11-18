"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock3,
  MapPin,
  PackageOpen,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ResourceImage } from "@/components/shared/resource-image";
import {
  BookingStatusBadge,
  ConditionBadge,
  ReturnStatusBadge,
} from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/context/app-provider";
import {
  formatDate,
  formatDateRange,
  formatDateTime,
  formatTimeRange,
} from "@/lib/utils";
import {
  getBookingTimeline,
  getCancelEligibility,
  type TimelineStep,
} from "@/services/booking.service";
import { getReturnForBooking } from "@/services/return.service";
import type { ReturnRecord } from "@/types/return";

const STEP_STYLE: Record<
  TimelineStep["state"],
  { icon: typeof CheckCircle2; className: string }
> = {
  complete: { icon: CheckCircle2, className: "text-emerald-600" },
  current: { icon: Clock3, className: "text-indigo-600" },
  upcoming: { icon: Circle, className: "text-slate-300" },
  rejected: { icon: XCircle, className: "text-rose-500" },
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-[13px] font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function ReturnDetailsCard({ record }: { record: ReturnRecord }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Issue & return</CardTitle>
          <ReturnStatusBadge record={record} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-[12px]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">Issued</span>
          <span className="font-medium text-slate-700">
            {formatDate(record.issueDate ?? "")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">Expected back</span>
          <span className="font-medium text-slate-700">
            {formatDate(record.expectedReturnDate)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">Units out</span>
          <span className="font-medium text-slate-700 tabular">
            {record.issuedQuantity - record.returnedQuantity}
          </span>
        </div>
        {record.actualReturnDate ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Returned</span>
            <span className="font-medium text-slate-700">
              {formatDate(record.actualReturnDate)}
            </span>
          </div>
        ) : null}
        {record.condition ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Condition</span>
            <ConditionBadge condition={record.condition} />
          </div>
        ) : null}
        {record.issueNotes ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-[11px] leading-5 text-slate-500">
            {record.issueNotes}
          </p>
        ) : null}
        {record.status === "issued" ? (
          <p className="flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-[11px] leading-5 text-indigo-700">
            <RotateCcw className="mt-0.5 size-3.5 shrink-0" />
            Return equipment to the resource desk by the expected date to avoid
            overdue penalties.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function BookingDetails({ bookingId }: { bookingId: string }) {
  const {
    bookings,
    resources,
    categories,
    returns,
    currentUser,
    cancelBooking,
  } = useApp();
  const [cancelOpen, setCancelOpen] = useState(false);

  const booking = bookings.find((item) => item.id === bookingId);
  const isOwnBooking = booking?.userId === currentUser.id;

  if (!booking || !isOwnBooking) {
    return (
      <div className="space-y-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/my-bookings">
            <ArrowLeft className="size-4" />
            Back to my bookings
          </Link>
        </Button>
        <EmptyState
          icon={PackageOpen}
          title="Booking not found"
          description="This booking may have been removed, or the link belongs to another user."
          action={
            <Button asChild>
              <Link href="/my-bookings">View my bookings</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const resource = resources.find((item) => item.id === booking.resourceId);
  const category = categories.find(
    (item) => item.id === resource?.categoryId,
  );
  const returnRecord = getReturnForBooking(returns, booking.id);
  const cancelEligibility = getCancelEligibility(booking, returnRecord);
  const timeline = getBookingTimeline(booking, returnRecord);
  const canBookAgain = ["completed", "rejected", "cancelled"].includes(
    booking.status,
  );

  const handleCancel = () => {
    const result = cancelBooking(booking.id);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setCancelOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/my-bookings">
            <ArrowLeft className="size-4" />
            Back to my bookings
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {resource ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/resources/${resource.id}`}>View resource</Link>
            </Button>
          ) : null}
          {canBookAgain && resource ? (
            <Button asChild size="sm">
              <Link href={`/bookings/new?resourceId=${resource.id}`}>
                <RotateCcw className="size-3.5" />
                Book again
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-indigo-600">
            Booking reference
          </p>
          <h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight text-slate-900">
            {booking.bookingReference}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <BookingStatusBadge status={booking.status} />
            <span>Requested {formatDateTime(booking.createdAt)}</span>
          </div>
        </div>
        {cancelEligibility.allowed ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setCancelOpen(true)}
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <XCircle className="size-4" />
            Cancel booking
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Resource</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <ResourceImage
                  src={resource?.image}
                  alt={resource?.name ?? "Resource"}
                  assetTag={resource?.assetTag}
                  className="h-36 w-full shrink-0 rounded-lg sm:size-32"
                  sizes="(max-width: 640px) 100vw, 128px"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    {category?.name ?? "Uncategorised"}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                    {resource?.name ?? "Resource removed"}
                  </h2>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    {resource?.assetTag ?? "—"}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-[12px] text-slate-500">
                    <MapPin className="size-3.5" />
                    Collect from {resource?.location ?? "the resource desk"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-slate-500">
                    <PackageOpen className="size-3.5" />
                    {booking.quantity} unit{booking.quantity === 1 ? "" : "s"}{" "}
                    requested
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                <DetailRow
                  label="Dates"
                  value={formatDateRange(
                    booking.startDate,
                    booking.endDate,
                  )}
                />
                <DetailRow
                  label="Time"
                  value={formatTimeRange(booking.startTime, booking.endTime)}
                />
                <DetailRow label="Quantity" value={`${booking.quantity}`} />
                <DetailRow
                  label="Status"
                  value={<BookingStatusBadge status={booking.status} />}
                />
              </dl>
              <Separator className="my-5" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Purpose
                </p>
                <p className="mt-1.5 text-[13px] leading-6 text-slate-600">
                  {booking.purpose}
                </p>
              </div>
              {booking.notes ? (
                <div className="mt-4">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Your notes
                  </p>
                  <p className="mt-1.5 text-[13px] leading-6 text-slate-600">
                    {booking.notes}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <p className="text-sm text-slate-500">
                Follow the request from submission to return.
              </p>
            </CardHeader>
            <CardContent>
              <ol className="space-y-0">
                {timeline.map((step, index) => {
                  const style = STEP_STYLE[step.state];
                  const Icon = style.icon;
                  return (
                    <li key={`${step.label}-${index}`} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <Icon
                          className={`mt-0.5 size-[18px] shrink-0 ${style.className}`}
                        />
                        {index < timeline.length - 1 ? (
                          <span className="my-1 w-px flex-1 bg-slate-200" />
                        ) : null}
                      </div>
                      <div
                        className={
                          index < timeline.length - 1 ? "pb-5" : undefined
                        }
                      >
                        <p className="text-[13px] font-medium text-slate-800">
                          {step.label}
                        </p>
                        {step.description ? (
                          <p className="mt-0.5 text-[12px] leading-5 text-slate-500">
                            {step.description}
                          </p>
                        ) : null}
                        {step.date ? (
                          <p className="mt-1 font-mono text-[10px] text-slate-400">
                            {formatDateTime(step.date)}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[12px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Status</span>
                <BookingStatusBadge status={booking.status} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Submitted</span>
                <span className="text-right font-medium text-slate-700">
                  {formatDateTime(booking.createdAt)}
                </span>
              </div>
              {booking.decisionAt ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Decision</span>
                  <span className="text-right font-medium text-slate-700">
                    {formatDateTime(booking.decisionAt)}
                  </span>
                </div>
              ) : null}
              {booking.adminNotes ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Manager note
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-slate-600">
                    {booking.adminNotes}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] leading-5 text-slate-400">
                  {booking.status === "pending"
                    ? "A resource manager is reviewing your request. You will see the decision here."
                    : "No additional notes were provided."}
                </p>
              )}
              {!cancelEligibility.allowed && cancelEligibility.reason ? (
                <p className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-[11px] leading-5 text-slate-500">
                  <Clock3 className="mt-0.5 size-3.5 shrink-0" />
                  {cancelEligibility.reason}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {returnRecord ? <ReturnDetailsCard record={returnRecord} /> : null}

          <Card>
            <CardHeader>
              <CardTitle>Need help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-[12px] leading-5 text-slate-500">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                {resource?.location ?? "Resource desk"}, Library Building
              </p>
              <p className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                Collection hours: Mon–Fri, 9:00 AM – 6:00 PM
              </p>
              <p className="flex items-start gap-2">
                <ClipboardList className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                Bring your university ID when collecting equipment.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this booking?"
        description={`${booking.bookingReference} will be cancelled and any held units will be released. This cannot be undone.`}
        confirmLabel="Cancel booking"
        destructive
        onConfirm={handleCancel}
      />
    </div>
  );
}
