"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Package,
  PackagePlus,
  Pencil,
  Search,
  Trash2,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { ResourceImage } from "@/components/shared/resource-image";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { ResourceAvailabilityBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApp } from "@/context/app-provider";
import { RESOURCE_STATUS_META } from "@/lib/constants";
import { cn, pluralize } from "@/lib/utils";
import { usePagination } from "@/hooks/use-pagination";
import {
  filterResources,
  getInventoryStats,
  type ResourceSort,
} from "@/services/resource.service";
import type { Resource, ResourceStatus } from "@/types/resource";
import { ResourceFormDialog } from "./resource-form-dialog";

type StatusFilter = ResourceStatus | "all";

export function AdminResourcesPage() {
  const { resources, categories, deleteResource } = useApp();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<ResourceSort>("newest");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Resource | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  const stats = getInventoryStats(resources);
  const filteredResources = filterResources(resources, {
    search,
    categoryId,
    location: "all",
    availability: "all",
    sort,
  }).filter((resource) => status === "all" || resource.status === status);
  const pagination = usePagination(filteredResources, 8);

  const openCreate = () => {
    setEditTarget(undefined);
    setFormOpen(true);
  };

  const openEdit = (resource: Resource) => {
    setEditTarget(resource);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const result = await deleteResource(deleteTarget.id);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setDeleteTarget(null);
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryId("all");
    setStatus("all");
    setSort("newest");
    pagination.setPage(1);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operations"
        title="Resource inventory"
        description="Manage equipment records, stock levels, collection locations, and maintenance status."
        actions={
          <Button type="button" onClick={openCreate}>
            <PackagePlus className="size-4" />
            Add resource
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Resources"
          value={stats.totalResources}
          hint={`${stats.totalUnits} total units`}
          icon={Boxes}
          accent="indigo"
        />
        <StatCard
          label="Units available"
          value={stats.availableUnits}
          hint="Across all bookable equipment"
          icon={Package}
          accent="emerald"
        />
        <StatCard
          label="Fully booked"
          value={stats.fullyBooked}
          hint="No units currently available"
          icon={TriangleAlert}
          accent="amber"
        />
        <StatCard
          label="In maintenance"
          value={stats.maintenance}
          hint={`${stats.lowStock} low-stock resources`}
          icon={Wrench}
          accent="rose"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-3 xl:flex-row xl:items-center">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            pagination.setPage(1);
          }}
          placeholder="Search by name, asset tag, or location"
          ariaLabel="Search inventory"
          className="flex-1"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Select
            value={categoryId}
            onValueChange={(value) => {
              setCategoryId(value);
              pagination.setPage(1);
            }}
          >
            <SelectTrigger aria-label="Filter inventory by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter);
              pagination.setPage(1);
            }}
          >
            <SelectTrigger aria-label="Filter inventory by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(RESOURCE_STATUS_META) as ResourceStatus[]).map(
                (resourceStatus) => (
                  <SelectItem key={resourceStatus} value={resourceStatus}>
                    {RESOURCE_STATUS_META[resourceStatus].label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value as ResourceSort);
              pagination.setPage(1);
            }}
          >
            <SelectTrigger aria-label="Sort inventory">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="name-asc">Name A–Z</SelectItem>
              <SelectItem value="name-desc">Name Z–A</SelectItem>
              <SelectItem value="availability">Most available</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-[11px] text-slate-400">
        {pluralize(filteredResources.length, "resource")} in view
      </p>

      {filteredResources.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No resources match"
          description="Try a broader search or clear the category and status filters."
          action={
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-white">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                <TableHead>Resource</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.pageItems.map((resource) => {
                const category = categories.find(
                  (item) => item.id === resource.categoryId,
                );
                const availablePercent =
                  resource.totalQuantity > 0
                    ? Math.round(
                        (resource.availableQuantity /
                          resource.totalQuantity) *
                          100,
                      )
                    : 0;

                return (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ResourceImage
                          src={resource.image}
                          alt={resource.name}
                          assetTag={resource.assetTag}
                          className="size-10 shrink-0 rounded-lg"
                          sizes="40px"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/resources/${resource.id}`}
                            className="block max-w-60 truncate text-[13px] font-medium text-slate-800 hover:text-indigo-700"
                          >
                            {resource.name}
                          </Link>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-400">
                            {resource.assetTag}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px]">
                      {category?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="w-32">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-medium text-slate-700 tabular">
                            {resource.availableQuantity} /{" "}
                            {resource.totalQuantity}
                          </span>
                          <span className="text-slate-400 tabular">
                            {availablePercent}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              availablePercent > 50
                                ? "bg-emerald-500"
                                : availablePercent > 20
                                  ? "bg-amber-500"
                                  : "bg-rose-500",
                            )}
                            style={{ width: `${availablePercent}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px]">
                      {resource.location}
                    </TableCell>
                    <TableCell>
                      <ResourceAvailabilityBadge resource={resource} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(resource)}
                          aria-label={`Edit ${resource.name}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => setDeleteTarget(resource)}
                          aria-label={`Delete ${resource.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            itemLabel="resources"
            className="mx-4 mb-4 mt-1"
          />
        </div>
      )}

      <ResourceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        resource={editTarget}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete this resource?"
        description={
          deleteTarget
            ? `${deleteTarget.name} will be removed from the catalogue. Resources with active bookings cannot be deleted.`
            : ""
        }
        confirmLabel="Delete resource"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
