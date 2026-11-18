import type { Metadata } from "next";

import { NewBookingForm } from "@/features/bookings/components/new-booking-form";

export const metadata: Metadata = {
  title: "New booking",
};

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ resourceId?: string | string[] }>;
}) {
  const params = await searchParams;
  const resourceId =
    typeof params.resourceId === "string" ? params.resourceId : undefined;

  return <NewBookingForm initialResourceId={resourceId} />;
}
