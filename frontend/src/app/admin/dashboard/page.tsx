import type { Metadata } from "next";

import { AdminDashboard } from "@/features/admin/components/admin-dashboard";

export const metadata: Metadata = {
  title: "Operations dashboard",
};

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
