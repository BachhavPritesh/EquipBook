"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PackageSearch, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-provider";
import { CATALOGUE_PAGE_SIZE } from "@/lib/constants";
import { pluralize } from "@/lib/utils";
import {
  filterResources,
  getResourceLocations,
} from "@/services/resource.service";
import { usePagination } from "@/hooks/use-pagination";
import { ResourceCard } from "./resource-card";
import {
  DEFAULT_RESOURCE_FILTERS,
  ResourceFilters,
  type ResourceFilterState,
} from "./resource-filters";

export function ResourceCatalogue() {
  const { resources, categories } = useApp();
  const [filters, setFilters] = useState<ResourceFilterState>(
    DEFAULT_RESOURCE_FILTERS,
  );

  const filtered = useMemo(
    () =>
      filterResources(resources, {
        search: filters.search,
        categoryId: filters.categoryId,
        location: filters.location,
        availability: filters.availability,
        sort: filters.sort,
      }),
    [resources, filters],
  );

  const locations = useMemo(() => getResourceLocations(resources), [resources]);
  const pagination = usePagination(filtered, CATALOGUE_PAGE_SIZE);
  const availableCount = resources.filter(
    (resource) => resource.status === "available" && resource.availableQuantity > 0,
  ).length;

  const updateFilters = (next: ResourceFilterState) => {
    setFilters(next);
    pagination.setPage(1);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Resource catalogue"
        title="Browse shared equipment"
        description={`Find gear across ${pluralize(categories.length, "category", "categories")}. Check availability, review requirements, and request a reservation.`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/availability">Check availability</Link>
            </Button>
            <Button asChild>
              <Link href="/bookings/new">
                <Plus className="size-4" />
                New booking
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-slate-500">
        <p>
          <span className="font-semibold text-slate-800">{availableCount}</span>{" "}
          resources available now ·{" "}
          <span className="font-semibold text-slate-800">
            {resources.length}
          </span>{" "}
          in the catalogue
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
          Updated just now
        </p>
      </div>

      <ResourceFilters
        filters={filters}
        onChange={updateFilters}
        categories={categories}
        locations={locations}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No resources match those filters"
          description="Try a broader search, clear the category or location filters, or check the full catalogue."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => updateFilters(DEFAULT_RESOURCE_FILTERS)}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <div
            className={
              filters.view === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                : "space-y-4"
            }
          >
            {pagination.pageItems.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                category={categories.find(
                  (category) => category.id === resource.categoryId,
                )}
                view={filters.view}
              />
            ))}
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            itemLabel="resources"
          />
        </>
      )}
    </div>
  );
}
