import { getTodayKey } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import type { Resource } from "@/types/resource";
import type { User } from "@/types/user";

function escapeCsvValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportBookingsToCsv(
  bookings: Booking[],
  resources: Resource[],
  users: User[],
): void {
  const header = [
    "Reference",
    "Requester",
    "Email",
    "Resource",
    "Asset tag",
    "Start date",
    "End date",
    "Start time",
    "End time",
    "Quantity",
    "Status",
    "Purpose",
    "Submitted",
  ];

  const rows = bookings.map((booking) => {
    const resource = resources.find(
      (item) => item.id === booking.resourceId,
    );
    const user = users.find((item) => item.id === booking.userId);
    return [
      booking.bookingReference,
      user?.name ?? "Unknown",
      user?.email ?? "",
      resource?.name ?? "Removed resource",
      resource?.assetTag ?? "",
      booking.startDate,
      booking.endDate,
      booking.startTime,
      booking.endTime,
      String(booking.quantity),
      booking.status,
      booking.purpose,
      booking.createdAt,
    ].map(escapeCsvValue);
  });

  const csv = [header.map(escapeCsvValue).join(","), ...rows.map((row) => row.join(","))].join(
    "\n",
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `equipbook-bookings-${getTodayKey()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
