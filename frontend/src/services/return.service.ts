import {
  differenceInCalendarDays,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";

import type {
  EffectiveReturnStatus,
  ReturnRecord,
  ReturnStatus,
} from "@/types/return";

type ReturnRecordWithStatus = ReturnRecord;

export function isReturnOverdue(record: ReturnRecordWithStatus): boolean {
  if (record.status !== "issued") return false;
  const expected = parseISO(record.expectedReturnDate);
  if (!isValid(expected)) return false;
  return expected < startOfDay(new Date());
}

export function getEffectiveReturnStatus(
  record: ReturnRecord,
): EffectiveReturnStatus {
  return isReturnOverdue(record) ? "overdue" : record.status;
}

export function getOverdueDays(record: ReturnRecord): number {
  if (!isReturnOverdue(record)) return 0;
  return Math.max(
    0,
    differenceInCalendarDays(
      startOfDay(new Date()),
      parseISO(record.expectedReturnDate),
    ),
  );
}

export function getReturnForBooking(
  returns: ReturnRecord[],
  bookingId: string,
): ReturnRecord | undefined {
  return returns.find((record) => record.bookingId === bookingId);
}

export interface ReturnStats {
  ready: number;
  issued: number;
  returned: number;
  overdue: number;
}

export function getReturnStats(records: ReturnRecord[]): ReturnStats {
  return records.reduce<ReturnStats>(
    (stats, record) => {
      const next = { ...stats };
      if (record.status === "ready") next.ready += 1;
      if (record.status === "issued") next.issued += 1;
      if (record.status === "returned") next.returned += 1;
      if (isReturnOverdue(record)) next.overdue += 1;
      return next;
    },
    { ready: 0, issued: 0, returned: 0, overdue: 0 },
  );
}

export function groupReturnsByStatus(
  records: ReturnRecord[],
): Record<"ready" | "issued" | "returned" | "overdue", ReturnRecord[]> {
  return {
    ready: records.filter((record) => record.status === "ready"),
    issued: records.filter(
      (record) => record.status === "issued" && !isReturnOverdue(record),
    ),
    returned: records.filter((record) => record.status === "returned"),
    overdue: records.filter((record) => isReturnOverdue(record)),
  };
}

export function getReturnStatusLabel(status: ReturnStatus): string {
  if (status === "ready") return "Ready to issue";
  if (status === "issued") return "Issued";
  return "Returned";
}
