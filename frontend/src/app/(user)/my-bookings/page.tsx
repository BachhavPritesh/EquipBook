import type { Metadata } from "next";

import { MyBookingsPage } from "@/features/bookings/components/my-bookings-page";

export const metadata: Metadata = {
  title: "My bookings",
};

export default function MyBookingsRoute() {
  return <MyBookingsPage />;
}
