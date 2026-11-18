import type { Metadata } from "next";

import { AdminAnalyticsPage } from "@/features/admin/components/admin-analytics-page";

export const metadata: Metadata = {
  title: "Usage analytics",
};

export default function AdminAnalyticsRoute() {
  return <AdminAnalyticsPage />;
}
