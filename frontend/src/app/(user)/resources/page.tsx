import type { Metadata } from "next";

import { ResourceCatalogue } from "@/features/resources/components/resource-catalogue";

export const metadata: Metadata = {
  title: "Resources",
};

export default function ResourcesPage() {
  return <ResourceCatalogue />;
}
