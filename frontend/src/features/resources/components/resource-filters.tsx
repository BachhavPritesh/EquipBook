"use client";

import { LayoutGrid, List } from "lucide-react";

import { SearchInput } from "@/components/shared/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type {
  AvailabilityFilter,
  ResourceSort,
} from "@/services/resource.service";
import type { Category } from "@/types/category";

export type ResourceView = "grid" | "list";

export interface ResourceFilterState {
  search: string;
  categoryId: string;
  location: string;
  availability: AvailabilityFilter;
  sort: ResourceSort;
  view: ResourceView;
}

export const DEFAULT_RESOURCE_FILTERS: ResourceFilterState = {
  search: "",
  categoryId: "all",
  location: "all",
  availability: "all",
  sort: "newest",
  view: "grid",
};

export function ResourceFilters({
  filters,
  onChange,
  categories,
  locations,
}: {
  filters: ResourceFilterState;
  onChange: (filters: ResourceFilterState) => void;
  categories: Category[];
  locations: string[];
}) {
  const update = <K extends keyof ResourceFilterState>(
    key: K,
    value: ResourceFilterState[K],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="rounded-xl border border-border bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput
          value={filters.search}
          onChange={(value) => update("search", value)}
          placeholder="Search by name, asset tag, or location…"
          className="w-full lg:max-w-sm"
          ariaLabel="Search the resource catalogue"
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-1">
          <Select
            value={filters.categoryId}
            onValueChange={(value) => update("categoryId", value)}
          >
            <SelectTrigger className="h-9 text-[12px]" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
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
            value={filters.location}
            onValueChange={(value) => update("location", value)}
          >
            <SelectTrigger className="h-9 text-[12px]" aria-label="Filter by location">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.availability}
            onValueChange={(value) =>
              update("availability", value as AvailabilityFilter)
            }
          >
            <SelectTrigger className="h-9 text-[12px]" aria-label="Filter by availability">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any availability</SelectItem>
              <SelectItem value="available">Available now</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sort}
            onValueChange={(value) => update("sort", value as ResourceSort)}
          >
            <SelectTrigger className="h-9 text-[12px]" aria-label="Sort resources">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Recently added</SelectItem>
              <SelectItem value="name-asc">Name A–Z</SelectItem>
              <SelectItem value="name-desc">Name Z–A</SelectItem>
              <SelectItem value="availability">Most available</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1 self-end rounded-lg border border-border p-1 lg:self-auto">
          <Button
            type="button"
            variant={filters.view === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => update("view", "grid")}
            aria-label="Grid view"
            aria-pressed={filters.view === "grid"}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            type="button"
            variant={filters.view === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => update("view", "list")}
            aria-label="List view"
            aria-pressed={filters.view === "list"}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
