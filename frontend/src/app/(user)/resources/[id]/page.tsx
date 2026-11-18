import type { Metadata } from "next";

import { ResourceDetails } from "@/features/resources/components/resource-details";

export const metadata: Metadata = {
  title: "Resource details",
};

export default async function ResourceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResourceDetails resourceId={id} />;
}
