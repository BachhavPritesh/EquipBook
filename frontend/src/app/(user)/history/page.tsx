import type { Metadata } from "next";

import { BookingHistoryPage } from "@/features/bookings/components/booking-history-page";

export const metadata: Metadata = {
  title: "Booking history",
};

export default function HistoryPage() {
  return <BookingHistoryPage />;
}
