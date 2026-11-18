import type { Metadata } from "next";

import { AdminCalendarPage } from "@/features/admin/components/admin-calendar-page";

export const metadata: Metadata = {
  title: "Availability calendar",
};

export default function AdminCalendarRoute() {
  return <AdminCalendarPage />;
}
