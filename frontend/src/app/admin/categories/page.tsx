import type { Metadata } from "next";

import { AdminCategoriesPage } from "@/features/admin/components/admin-categories-page";

export const metadata: Metadata = {
  title: "Categories",
};

export default function AdminCategoriesRoute() {
  return <AdminCategoriesPage />;
}
