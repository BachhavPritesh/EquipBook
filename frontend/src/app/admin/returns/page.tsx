import type { Metadata } from "next";

import { AdminReturnsPage } from "@/features/admin/components/admin-returns-page";

export const metadata: Metadata = {
  title: "Issue & returns",
};

export default function AdminReturnsRoute() {
  return <AdminReturnsPage />;
}
