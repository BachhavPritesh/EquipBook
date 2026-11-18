import type { Metadata } from "next";

import { AdminSettingsPage } from "@/features/admin/components/admin-settings-page";

export const metadata: Metadata = {
  title: "Workspace settings",
};

export default function AdminSettingsRoute() {
  return <AdminSettingsPage />;
}
