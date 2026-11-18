"use client";

import { useState } from "react";
import {
  Boxes,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/app-provider";
import { pluralize } from "@/lib/utils";
import type { Category } from "@/types/category";
import { CategoryFormDialog } from "./category-form-dialog";

export function AdminCategoriesPage() {
  const { categories, resources, bookings, deleteCategory } = useApp();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredCategories = categories.filter((category) =>
    `${category.name} ${category.description}`
      .toLowerCase()
      .includes(normalizedSearch),
  );

  const getResourceCount = (categoryId: string) =>
    resources.filter((resource) => resource.categoryId === categoryId).length;
  const getBookingCount = (categoryId: string) => {
    const categoryResources = resources
      .filter((resource) => resource.categoryId === categoryId)
      .map((resource) => resource.id);
    return bookings.filter((booking) =>
      categoryResources.includes(booking.resourceId),
    ).length;
  };
  const largestCategory = [...categories].sort(
    (a, b) => getResourceCount(b.id) - getResourceCount(a.id),
  )[0];

  const openCreate = () => {
    setEditTarget(undefined);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditTarget(category);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const result = await deleteCategory(deleteTarget.id);
    if (result.success) {
      toast.success(result.message);
      setDeleteTarget(null);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Configuration"
        title="Categories"
        description="Organise equipment into clear groups for browsing, filtering, and reporting."
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus className="size-4" />
            New category
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Categories"
          value={categories.length}
          hint="Across the shared catalogue"
          icon={Tags}
          accent="indigo"
        />
        <StatCard
          label="Categorised resources"
          value={resources.length}
          hint={`${pluralize(categories.length, "group")} in total`}
          icon={Boxes}
          accent="blue"
        />
        <StatCard
          label="Largest category"
          value={largestCategory ? largestCategory.name : "—"}
          hint={
            largestCategory
              ? `${getResourceCount(largestCategory.id)} resources`
              : "No categories yet"
          }
          icon={FolderOpen}
          accent="emerald"
        />
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search categories"
        ariaLabel="Search categories"
        className="max-w-md"
      />

      {filteredCategories.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No categories found"
          description={
            categories.length === 0
              ? "Create your first category before adding resources."
              : "No categories match that search."
          }
          action={
            categories.length === 0 ? (
              <Button type="button" onClick={openCreate}>
                <Plus className="size-4" />
                New category
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setSearch("")}>
                Clear search
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCategories.map((category) => (
            <Card key={category.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600">
                    <Tags className="size-4" />
                  </span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEdit(category)}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => setDeleteTarget(category)}
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <h2 className="mt-3 text-[15px] font-semibold tracking-tight text-slate-900">
                  {category.name}
                </h2>
                <p className="mt-1.5 min-h-10 text-[12px] leading-5 text-slate-500">
                  {category.description}
                </p>
                <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
                  <span>
                    <span className="font-semibold text-slate-700">
                      {getResourceCount(category.id)}
                    </span>{" "}
                    resources
                  </span>
                  <span>
                    <span className="font-semibold text-slate-700">
                      {getBookingCount(category.id)}
                    </span>{" "}
                    bookings
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editTarget}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete this category?"
        description={
          deleteTarget
            ? `${deleteTarget.name} can only be removed after its resources are moved or deleted.`
            : ""
        }
        confirmLabel="Delete category"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
