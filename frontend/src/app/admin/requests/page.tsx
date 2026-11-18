import type { Metadata } from "next";

import { AdminRequestsPage } from "@/features/admin/components/admin-requests-page";

export const metadata: Metadata = {
  title: "Booking requests",
};

export default function AdminRequestsRoute() {
  return <AdminRequestsPage />;
}
