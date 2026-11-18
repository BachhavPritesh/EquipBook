import type { Metadata } from "next";

import { AvailabilityPage } from "@/features/resources/components/availability-page";

export const metadata: Metadata = {
  title: "Availability",
};

export default function AvailabilityRoute() {
  return <AvailabilityPage />;
}
