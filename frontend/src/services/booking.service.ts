import {
  differenceInCalendarDays,
  isValid,
  isWithinInterval,
  parseISO,
  startOfDay,
} from "date-fns";

import { BOOKING_STATUS_META } from "@/lib/constants";
import { getTodayKey, toDateKey } from "@/lib/utils";
import type {
  Booking,
  BookingDateRange,
  BookingStatus,
} from "@/types/booking";
import type { Resource } from "@/types/resource";
import type { ReturnRecord } from "@/types/return";
import type { User } from "@/types/user";

function getBookingStart(booking: BookingDateRange): Date {
  return new Date(`${booking.startDate}T${booking.startTime}:00`);
}

function getBookingEnd(booking: BookingDateRange): Date {
  return new Date(`${booking.endDate}T${booking.endTime}:00`);
}

export function doBookingsOverlap(
  a: BookingDateRange,
  b: BookingDateRange,
): boolean {
  return getBookingStart(a) < getBookingEnd(b) && getBookingEnd(a) > getBookingStart(b);
}

export function isBookingWithinRange(
  booking: Booking,
  range: BookingDateRange,
): boolean {
  return doBookingsOverlap(booking, range);
}

export function getPendingReservedQuantity(
  resourceId: string,
  bookings: Booking[],
  range: BookingDateRange,
): number {
  return bookings
    .filter(
      (booking) =>
        booking.resourceId === resourceId &&
        booking.status === "pending" &&
        doBookingsOverlap(booking, range),
    )
    .reduce((total, booking) => total + booking.quantity, 0);
}

export interface AvailabilityPreview {
  pendingReserved: number;
  projectedAvailable: number;
  isEnough: boolean;
  isBookable: boolean;
}

export function getAvailabilityPreview(
  resource: Resource,
  bookings: Booking[],
  range: BookingDateRange,
  requestedQuantity: number,
): AvailabilityPreview {
  const pendingReserved = getPendingReservedQuantity(
    resource.id,
    bookings,
    range,
  );
  const projectedAvailable = Math.max(
    0,
    resource.availableQuantity - pendingReserved,
  );
  const isBookable =
    resource.status === "available" && resource.availableQuantity > 0;

  return {
    pendingReserved,
    projectedAvailable,
    isEnough:
      isBookable &&
      requestedQuantity > 0 &&
      requestedQuantity <= projectedAvailable,
    isBookable,
  };
}

export function validateBookingWindow(range: BookingDateRange): boolean {
  const start = getBookingStart(range);
  const end = getBookingEnd(range);
  return isValid(start) && isValid(end) && start < end;
}

export function generateBookingReference(bookings: Booking[]): string {
  const year = new Date().getFullYear();
  const maxSequence = bookings.reduce((max, booking) => {
    const match = /^EQ-\d{4}-(\d+)$/.exec(booking.bookingReference);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);

  let sequence = maxSequence + 1;
  let reference = `EQ-${year}-${String(sequence).padStart(4, "0")}`;
  const references = new Set(bookings.map((booking) => booking.bookingReference));

  while (references.has(reference)) {
    sequence += 1;
    reference = `EQ-${year}-${String(sequence).padStart(4, "0")}`;
  }

  return reference;
}

export interface CancelEligibility {
  allowed: boolean;
  reason?: string;
}

export function getCancelEligibility(
  booking: Booking,
  returnRecord?: ReturnRecord,
): CancelEligibility {
  if (booking.status === "pending") {
    return { allowed: true };
  }

  if (booking.status !== "approved") {
    return {
      allowed: false,
      reason: `Bookings with status "${BOOKING_STATUS_META[booking.status].label}" cannot be cancelled.`,
    };
  }

  if (returnRecord && returnRecord.status !== "ready") {
    return {
      allowed: false,
      reason:
        "This booking has already been issued. Please return the equipment to close it.",
    };
  }

  if (parseISO(booking.startDate) < startOfDay(new Date())) {
    return {
      allowed: false,
      reason: "This booking has already started and can no longer be cancelled.",
    };
  }

  return { allowed: true };
}

export function getBookingForUser(
  bookings: Booking[],
  userId: string,
): Booking[] {
  return bookings.filter((booking) => booking.userId === userId);
}

export function getUpcomingBookings(
  bookings: Booking[],
  options: { userId?: string; limit?: number } = {},
): Booking[] {
  const today = getTodayKey();
  return bookings
    .filter(
      (booking) =>
        booking.status === "approved" &&
        booking.endDate >= today &&
        (!options.userId || booking.userId === options.userId),
    )
    .sort(
      (a, b) =>
        new Date(`${a.startDate}T${a.startTime}`).getTime() -
        new Date(`${b.startDate}T${b.startTime}`).getTime(),
    )
    .slice(0, options.limit ?? Number.POSITIVE_INFINITY);
}

export function getRecentBookings(
  bookings: Booking[],
  options: { userId?: string; limit?: number } = {},
): Booking[] {
  return [...bookings]
    .filter(
      (booking) => !options.userId || booking.userId === options.userId,
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, options.limit ?? Number.POSITIVE_INFINITY);
}

export interface BookingStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  upcoming: number;
  rejected: number;
  cancelled: number;
}

export function getBookingStats(
  bookings: Booking[],
  userId?: string,
): BookingStats {
  const filtered = userId
    ? bookings.filter((booking) => booking.userId === userId)
    : bookings;
  const today = getTodayKey();

  return filtered.reduce<BookingStats>(
    (stats, booking) => {
      const next = { ...stats, total: stats.total + 1 };
      if (booking.status === "pending") next.pending += 1;
      if (booking.status === "approved") next.approved += 1;
      if (booking.status === "completed") next.completed += 1;
      if (booking.status === "rejected") next.rejected += 1;
      if (booking.status === "cancelled") next.cancelled += 1;
      if (booking.status === "approved" && booking.endDate >= today) {
        next.upcoming += 1;
      }
      return next;
    },
    {
      total: 0,
      pending: 0,
      approved: 0,
      completed: 0,
      upcoming: 0,
      rejected: 0,
      cancelled: 0,
    },
  );
}

export function getStatusCounts(
  bookings: Booking[],
): Record<BookingStatus, number> {
  return bookings.reduce<Record<BookingStatus, number>>(
    (counts, booking) => {
      counts[booking.status] += 1;
      return counts;
    },
    {
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      completed: 0,
    },
  );
}

export function getBookingDurationDays(booking: Booking): number {
  const start = parseISO(booking.startDate);
  const end = parseISO(booking.endDate);
  if (!isValid(start) || !isValid(end)) return 0;
  return differenceInCalendarDays(end, start) + 1;
}

export function isBookingIncludingToday(booking: Booking): boolean {
  const today = startOfDay(new Date());
  const start = parseISO(booking.startDate);
  const end = parseISO(booking.endDate);
  if (!isValid(start) || !isValid(end)) return false;
  return isWithinInterval(today, { start, end });
}

export function getBookingDayKeys(booking: Booking): string[] {
  const start = parseISO(booking.startDate);
  const end = parseISO(booking.endDate);
  if (!isValid(start) || !isValid(end) || start > end) return [];

  const keys: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

export function getUserName(users: User[], userId: string): string {
  return users.find((user) => user.id === userId)?.name ?? "Unknown user";
}

export function getBookingSearchText(
  booking: Booking,
  resources: Resource[],
  users: User[],
): string {
  const resource = resources.find((item) => item.id === booking.resourceId);
  const user = users.find((item) => item.id === booking.userId);
  return [
    booking.bookingReference,
    booking.purpose,
    resource?.name ?? "",
    resource?.assetTag ?? "",
    user?.name ?? "",
    user?.email ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export interface TimelineStep {
  label: string;
  description?: string;
  date?: string;
  state: "complete" | "current" | "upcoming" | "rejected";
}

export function getBookingTimeline(
  booking: Booking,
  returnRecord?: ReturnRecord,
): TimelineStep[] {
  const isCancelled = booking.status === "cancelled";
  const isRejected = booking.status === "rejected";

  const steps: TimelineStep[] = [
    {
      label: "Request submitted",
      description: "Your booking request was received.",
      date: booking.createdAt,
      state: "complete",
    },
  ];

  if (isCancelled) {
    steps.push({
      label: "Booking cancelled",
      description: "This booking was cancelled before collection.",
      date: booking.decisionAt,
      state: "current",
    });
    return steps;
  }

  if (isRejected) {
    steps.push({
      label: "Request reviewed",
      description:
        booking.adminNotes || "The resource manager declined this request.",
      date: booking.decisionAt,
      state: "rejected",
    });
    return steps;
  }

  const decisionState =
    booking.status === "pending" ? "current" : ("complete" as const);
  steps.push({
    label: booking.status === "pending" ? "Awaiting review" : "Request approved",
    description:
      booking.status === "pending"
        ? "A resource manager is reviewing your request."
        : booking.adminNotes || "Your booking was approved.",
    date: booking.decisionAt,
    state: decisionState,
  });

  if (booking.status !== "pending") {
    if (returnRecord?.status === "issued" && returnRecord.issueDate) {
      steps.push({
        label: "Equipment issued",
        description: returnRecord.issueNotes || "Collected from the resource desk.",
        date: returnRecord.issueDate,
        state: "complete",
      });
    } else if (returnRecord?.status === "returned") {
      steps.push({
        label: "Equipment issued",
        description: returnRecord.issueNotes || "Collected from the resource desk.",
        date: returnRecord.issueDate ?? undefined,
        state: "complete",
      });
    } else if (booking.status === "completed") {
      steps.push({
        label: "Equipment issued",
        date: returnRecord?.issueDate ?? undefined,
        state: "complete",
      });
    } else {
      const isOverdue = returnRecord?.expectedReturnDate
        ? returnRecord.expectedReturnDate < getTodayKey()
        : false;
      steps.push({
        label: isOverdue ? "Awaiting return" : "Ready for collection",
        description: isOverdue
          ? "The expected return date has passed."
          : "Collect your equipment from the resource desk.",
        date: returnRecord?.expectedReturnDate,
        state: booking.status === "approved" ? "current" : "upcoming",
      });
    }
  }

  if (returnRecord?.status === "returned" || booking.status === "completed") {
    steps.push({
      label: "Returned",
      description:
        returnRecord?.notes || "The equipment was returned and checked.",
      date: returnRecord?.actualReturnDate ?? undefined,
      state: "complete",
    });
  }

  return steps;
}
