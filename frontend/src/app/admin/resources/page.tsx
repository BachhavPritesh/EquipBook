import type { Metadata } from "next";

import { AdminResourcesPage } from "@/features/admin/components/admin-resources-page";

export const metadata: Metadata = {
  title: "Resource inventory",
};

export default function AdminResourcesRoute() {
  return <AdminResourcesPage />;
}
