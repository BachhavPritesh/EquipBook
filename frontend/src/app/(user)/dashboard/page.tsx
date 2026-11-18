import type { Metadata } from "next";

import { UserDashboard } from "@/features/dashboard/components/user-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return <UserDashboard />;
}
