import type { Metadata } from "next";

import { AdminBookingsPage } from "@/features/admin/components/admin-bookings-page";

export const metadata: Metadata = {
  title: "All bookings",
};

export default async function AdminBookingsRoute({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  const params = await searchParams;
  const reference =
    typeof params.ref === "string" ? params.ref : undefined;

  return <AdminBookingsPage initialSearch={reference} />;
}
