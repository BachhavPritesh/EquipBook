"use client";

import { useState } from "react";
import { PackageCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { ResourceImage } from "@/components/shared/resource-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/app-provider";
import {
  CONDITION_META,
  CONDITIONS,
} from "@/lib/constants";
import { formatDateRange, getTodayKey } from "@/lib/utils";
import type { ItemCondition } from "@/types/return";
import type { ReturnRow } from "../utils/return-rows";

function BookingSummary({ row }: { row: ReturnRow }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-2.5">
        <ResourceImage
          src={row.resource?.image}
          alt={row.resource?.name ?? "Resource"}
          assetTag={row.resource?.assetTag}
          className="size-10 shrink-0 rounded-md"
          sizes="40px"
        />
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-slate-800">
            {row.resource?.name ?? "Resource removed"}
          </p>
          <p className="truncate text-[10px] text-slate-400">
            {row.user?.name ?? "Unknown requester"} ·{" "}
            {formatDateRange(row.booking.startDate, row.booking.endDate)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function IssueEquipmentDialog({
  row,
  onClose,
}: {
  row: ReturnRow;
  onClose: () => void;
}) {
  const { issueBooking } = useApp();
  const [issueDate, setIssueDate] = useState(getTodayKey());
  const [quantity, setQuantity] = useState(row.booking.quantity);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (quantity < 1 || quantity > row.booking.quantity) {
      setError(`Issue between 1 and ${row.booking.quantity} units.`);
      return;
    }
    if (!issueDate) {
      setError("Choose an issue date.");
      return;
    }

    const result = issueBooking(row.booking.id, {
      issueDate,
      issuedQuantity: quantity,
      notes,
    });

    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="mb-1 flex size-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
          <PackageCheck className="size-5 text-blue-600" />
        </div>
        <DialogTitle>Issue equipment</DialogTitle>
        <DialogDescription>
          Confirm collection details for {row.booking.bookingReference}. This
          records the handover and starts the return clock.
        </DialogDescription>
      </DialogHeader>

      <BookingSummary row={row} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="issue-date">Issue date</Label>
          <Input
            id="issue-date"
            type="date"
            value={issueDate}
            onChange={(event) => {
              setIssueDate(event.target.value);
              setError("");
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="issue-quantity">Units issued</Label>
          <Input
            id="issue-quantity"
            type="number"
            min={1}
            max={row.booking.quantity}
            value={quantity}
            onChange={(event) => {
              setQuantity(Number(event.target.value));
              setError("");
            }}
          />
          <p className="text-[10px] text-slate-400">
            Requested: {row.booking.quantity} unit
            {row.booking.quantity === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="issue-notes">Handover note (optional)</Label>
        <Textarea
          id="issue-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={300}
          placeholder="Accessories included, collection instructions, or condition at handover."
        />
      </div>

      {error ? (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit}>
          <PackageCheck className="size-4" />
          Mark as issued
        </Button>
      </DialogFooter>
    </>
  );
}

export function RecordReturnDialog({
  row,
  onClose,
}: {
  row: ReturnRow;
  onClose: () => void;
}) {
  const { recordReturn } = useApp();
  const record = row.record;
  const remaining = record
    ? record.issuedQuantity - record.returnedQuantity
    : 0;
  const [actualReturnDate, setActualReturnDate] = useState(getTodayKey());
  const [quantity, setQuantity] = useState(Math.max(1, remaining));
  const [condition, setCondition] = useState<ItemCondition>("good");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  if (!record) return null;

  const handleSubmit = () => {
    if (quantity < 1 || quantity > remaining) {
      setError(`Return between 1 and ${remaining} units.`);
      return;
    }
    if (!actualReturnDate) {
      setError("Choose a return date.");
      return;
    }

    const result = recordReturn(record.id, {
      actualReturnDate,
      returnedQuantity: quantity,
      condition,
      notes,
    });

    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="mb-1 flex size-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
          <RotateCcw className="size-5 text-emerald-600" />
        </div>
        <DialogTitle>Record a return</DialogTitle>
        <DialogDescription>
          Check the equipment, choose its condition, and return units to
          available stock.
        </DialogDescription>
      </DialogHeader>

      <BookingSummary row={row} />

      <div className="rounded-lg border border-slate-200 p-3 text-[11px]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">Still out</span>
          <span className="font-medium text-slate-700 tabular">
            {remaining} unit{remaining === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <span className="text-slate-400">Expected back</span>
          <span className="font-medium text-slate-700">
            {record.expectedReturnDate}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="return-date">Return date</Label>
          <Input
            id="return-date"
            type="date"
            value={actualReturnDate}
            onChange={(event) => {
              setActualReturnDate(event.target.value);
              setError("");
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="return-quantity">Units returned</Label>
          <Input
            id="return-quantity"
            type="number"
            min={1}
            max={remaining}
            value={quantity}
            onChange={(event) => {
              setQuantity(Number(event.target.value));
              setError("");
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="return-condition">Condition</Label>
        <Select
          value={condition}
          onValueChange={(value) => setCondition(value as ItemCondition)}
        >
          <SelectTrigger id="return-condition">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((itemCondition) => (
              <SelectItem key={itemCondition} value={itemCondition}>
                {CONDITION_META[itemCondition].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="return-notes">Condition note (optional)</Label>
        <Textarea
          id="return-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={300}
          placeholder="Note missing accessories, damage, or anything the next borrower should know."
        />
      </div>

      {error ? (
        <p role="alert" className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant="success" onClick={handleSubmit}>
          <RotateCcw className="size-4" />
          Record return
        </Button>
      </DialogFooter>
    </>
  );
}

export function IssueEquipmentDialogShell({
  row,
  open,
  onOpenChange,
}: {
  row: ReturnRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && row ? (
          <IssueEquipmentDialog row={row} onClose={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function RecordReturnDialogShell({
  row,
  open,
  onOpenChange,
}: {
  row: ReturnRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && row ? (
          <RecordReturnDialog row={row} onClose={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
