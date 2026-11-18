"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  PackageX,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ResourceImage } from "@/components/shared/resource-image";
import { BookingStatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/app-provider";
import { formatDateRange } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import type { Resource } from "@/types/resource";
import type { User } from "@/types/user";

export type DecisionMode = "approve" | "reject";

function DecisionForm({
  booking,
  resource,
  user,
  mode,
  onClose,
}: {
  booking: Booking;
  resource?: Resource;
  user?: User;
  mode: DecisionMode;
  onClose: () => void;
}) {
  const { approveBooking, rejectBooking } = useApp();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const isApprove = mode === "approve";
  const notEnoughStock =
    isApprove &&
    resource !== undefined &&
    resource.availableQuantity < booking.quantity;

  const handleSubmit = () => {
    if (!isApprove && notes.trim().length < 5) {
      setError("Add a short reason so the requester knows why.");
      return;
    }

    const result = isApprove
      ? approveBooking(booking.id, notes)
      : rejectBooking(booking.id, notes);

    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-semibold text-indigo-700">
            {booking.bookingReference}
          </span>
          <BookingStatusBadge status={booking.status} />
        </div>
        <div className="mt-3 flex items-center gap-2.5">
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
            <p className="text-[10px] text-slate-400">
              {booking.quantity} unit{booking.quantity === 1 ? "" : "s"} ·{" "}
              {formatDateRange(booking.startDate, booking.endDate)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2.5 border-t border-slate-200 pt-3">
          {user ? <UserAvatar user={user} className="size-7" /> : null}
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-slate-700">
              {user?.name ?? "Unknown requester"}
            </p>
            <p className="truncate text-[10px] text-slate-400">
              {user?.department ?? "—"} · {user?.email ?? "—"}
            </p>
          </div>
        </div>
        <p className="mt-3 border-t border-slate-200 pt-3 text-[11px] leading-5 text-slate-500">
          {booking.purpose}
        </p>
      </div>

      {notEnoughStock ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[11px] leading-5 text-amber-800">
          <PackageX className="mt-0.5 size-4 shrink-0" />
          Only {resource.availableQuantity} unit
          {resource.availableQuantity === 1 ? "" : "s"} available. Adjust
          inventory before approving, or decline the request.
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="decision-notes">
          Decision note {isApprove ? "(optional)" : "(required)"}
        </Label>
        <Textarea
          id="decision-notes"
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            if (error) setError("");
          }}
          maxLength={500}
          placeholder={
            isApprove
              ? "Add collection instructions or conditions (optional)."
              : "Explain why the request cannot be fulfilled."
          }
          aria-invalid={Boolean(error)}
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-slate-400">
            The requester sees this note in their booking timeline.
          </p>
          <p className="text-[10px] text-slate-400 tabular">
            {notes.length}/500
          </p>
        </div>
        {error ? (
          <p role="alert" className="text-xs font-medium text-rose-600">
            {error}
          </p>
        ) : null}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {isApprove ? (
          <Button
            type="button"
            variant="success"
            onClick={handleSubmit}
            disabled={notEnoughStock}
          >
            <CheckCircle2 className="size-4" />
            Approve request
          </Button>
        ) : (
          <Button type="button" variant="destructive" onClick={handleSubmit}>
            <XCircle className="size-4" />
            Reject request
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

export function BookingDecisionDialog({
  booking,
  resource,
  user,
  mode,
  open,
  onOpenChange,
}: {
  booking: Booking;
  resource?: Resource;
  user?: User;
  mode: DecisionMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isApprove = mode === "approve";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            {isApprove ? (
              <ClipboardCheck className="size-5 text-emerald-600" />
            ) : (
              <XCircle className="size-5 text-rose-500" />
            )}
          </div>
          <DialogTitle>
            {isApprove ? "Approve booking request" : "Reject booking request"}
          </DialogTitle>
          <DialogDescription>
            {isApprove
              ? "Approving reserves the requested units and notifies the requester."
              : "The requester will see your note in the booking timeline."}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <DecisionForm
            key={`${booking.id}-${mode}`}
            booking={booking}
            resource={resource}
            user={user}
            mode={mode}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
