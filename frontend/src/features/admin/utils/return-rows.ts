import { getEffectiveReturnStatus } from "@/services/return.service";
import type { Booking } from "@/types/booking";
import type { Resource } from "@/types/resource";
import type { ReturnRecord } from "@/types/return";
import type { User } from "@/types/user";

export type ReturnRowStatus = "ready" | "issued" | "overdue" | "returned";

export interface ReturnRow {
  booking: Booking;
  record?: ReturnRecord;
  resource?: Resource;
  user?: User;
  status: ReturnRowStatus;
}

export function buildReturnRows(
  bookings: Booking[],
  returns: ReturnRecord[],
  resources: Resource[],
  users: User[],
): ReturnRow[] {
  const rows: ReturnRow[] = [];

  for (const record of returns) {
    const booking = bookings.find((item) => item.id === record.bookingId);
    if (!booking) continue;
    rows.push({
      booking,
      record,
      resource: resources.find((item) => item.id === booking.resourceId),
      user: users.find((item) => item.id === booking.userId),
      status: getEffectiveReturnStatus(record),
    });
  }

  const bookedIds = new Set(returns.map((record) => record.bookingId));
  for (const booking of bookings) {
    if (booking.status !== "approved" || bookedIds.has(booking.id)) continue;
    rows.push({
      booking,
      resource: resources.find((item) => item.id === booking.resourceId),
      user: users.find((item) => item.id === booking.userId),
      status: "ready",
    });
  }

  return rows.sort((a, b) => {
    const aDate = a.record?.expectedReturnDate ?? a.booking.endDate;
    const bDate = b.record?.expectedReturnDate ?? b.booking.endDate;
    return aDate.localeCompare(bDate);
  });
}
