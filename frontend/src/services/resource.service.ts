import type { Resource } from "@/types/resource";

export type ResourceSort =
  | "newest"
  | "name-asc"
  | "name-desc"
  | "availability";

export type AvailabilityFilter =
  | "all"
  | "available"
  | "unavailable"
  | "maintenance";

export interface ResourceFilterOptions {
  search?: string;
  categoryId?: string;
  location?: string;
  availability?: AvailabilityFilter;
  sort?: ResourceSort;
}

export function isResourceBookable(resource: Resource): boolean {
  return resource.status === "available" && resource.availableQuantity > 0;
}

export function getResourceAvailabilityLabel(resource: Resource): string {
  if (resource.status === "maintenance") return "Maintenance";
  if (resource.status === "unavailable") return "Unavailable";
  if (resource.availableQuantity === 0) return "Fully booked";
  return "Available";
}

export function filterResources(
  resources: Resource[],
  options: ResourceFilterOptions,
): Resource[] {
  const search = options.search?.trim().toLowerCase() ?? "";

  const filtered = resources.filter((resource) => {
    const matchesSearch =
      search.length === 0 ||
      resource.name.toLowerCase().includes(search) ||
      resource.assetTag.toLowerCase().includes(search) ||
      resource.location.toLowerCase().includes(search) ||
      resource.description.toLowerCase().includes(search);

    const matchesCategory =
      !options.categoryId ||
      options.categoryId === "all" ||
      resource.categoryId === options.categoryId;
    const matchesLocation =
      !options.location ||
      options.location === "all" ||
      resource.location === options.location;

    const matchesAvailability =
      !options.availability ||
      options.availability === "all" ||
      (options.availability === "available" && isResourceBookable(resource)) ||
      (options.availability === "unavailable" &&
        !isResourceBookable(resource) &&
        resource.status !== "maintenance") ||
      (options.availability === "maintenance" &&
        resource.status === "maintenance");

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLocation &&
      matchesAvailability
    );
  });

  return sortResources(filtered, options.sort ?? "newest");
}

export function sortResources(
  resources: Resource[],
  sort: ResourceSort,
): Resource[] {
  const sorted = [...resources].sort((a, b) => {
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    if (sort === "name-desc") return b.name.localeCompare(a.name);
    if (sort === "availability") {
      return b.availableQuantity - a.availableQuantity;
    }
    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });
  return sorted;
}

export function getResourceLocations(resources: Resource[]): string[] {
  return [...new Set(resources.map((resource) => resource.location))].sort(
    (a, b) => a.localeCompare(b),
  );
}

export function getRelatedResources(
  resources: Resource[],
  resource: Resource,
  limit = 3,
): Resource[] {
  return resources
    .filter(
      (candidate) =>
        candidate.id !== resource.id &&
        candidate.categoryId === resource.categoryId,
    )
    .slice(0, limit);
}

export function getResourcesByCategory(
  resources: Resource[],
  categoryId: string,
): Resource[] {
  return resources.filter((resource) => resource.categoryId === categoryId);
}

export interface InventoryStats {
  totalResources: number;
  totalUnits: number;
  availableUnits: number;
  fullyBooked: number;
  maintenance: number;
  lowStock: number;
}

export function getInventoryStats(resources: Resource[]): InventoryStats {
  return resources.reduce<InventoryStats>(
    (stats, resource) => {
      const isMaintenance = resource.status === "maintenance";
      return {
        totalResources: stats.totalResources + 1,
        totalUnits: stats.totalUnits + resource.totalQuantity,
        availableUnits: stats.availableUnits + resource.availableQuantity,
        fullyBooked:
          stats.fullyBooked +
          (!isMaintenance && resource.availableQuantity === 0 ? 1 : 0),
        maintenance: stats.maintenance + (isMaintenance ? 1 : 0),
        lowStock:
          stats.lowStock +
          (!isMaintenance &&
          resource.availableQuantity > 0 &&
          resource.availableQuantity <= Math.max(1, Math.floor(resource.totalQuantity * 0.25))
            ? 1
            : 0),
      };
    },
    {
      totalResources: 0,
      totalUnits: 0,
      availableUnits: 0,
      fullyBooked: 0,
      maintenance: 0,
      lowStock: 0,
    },
  );
}
