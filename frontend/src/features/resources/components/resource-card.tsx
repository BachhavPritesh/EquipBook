import Link from "next/link";
import { ArrowUpRight, MapPin, Package } from "lucide-react";

import { ResourceImage } from "@/components/shared/resource-image";
import { ResourceAvailabilityBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isResourceBookable } from "@/services/resource.service";
import type { Category } from "@/types/category";
import type { Resource } from "@/types/resource";

export function ResourceCard({
  resource,
  category,
  view = "grid",
}: {
  resource: Resource;
  category?: Category;
  view?: "grid" | "list";
}) {
  const bookable = isResourceBookable(resource);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-slate-300 hover:shadow-md",
        view === "list" && "sm:flex-row",
      )}
    >
      <Link
        href={`/resources/${resource.id}`}
        className={cn(
          "relative block shrink-0 overflow-hidden",
          view === "grid"
            ? "aspect-[4/3]"
            : "aspect-[16/9] sm:aspect-auto sm:w-56",
        )}
        aria-label={`View ${resource.name}`}
      >
        <ResourceImage
          src={resource.image}
          alt={resource.name}
          assetTag={resource.assetTag}
          className={cn("size-full", view === "list" && "sm:min-h-52")}
          sizes={
            view === "list"
              ? "(max-width: 640px) 100vw, 224px"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
        />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="rounded-full border border-white/70 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-600 shadow-sm backdrop-blur">
            {category?.name ?? "Uncategorised"}
          </span>
          <ResourceAvailabilityBadge resource={resource} className="shadow-sm" />
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <p className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-slate-400">
          {resource.assetTag}
        </p>
        <Link
          href={`/resources/${resource.id}`}
          className="mt-1 line-clamp-1 text-[15px] font-semibold tracking-tight text-slate-900 transition-colors hover:text-indigo-700"
        >
          {resource.name}
        </Link>
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-slate-500">
          {resource.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 text-slate-400" />
            {resource.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Package className="size-3.5 text-slate-400" />
            <span className="tabular">
              {resource.availableQuantity} of {resource.totalQuantity}
            </span>{" "}
            available
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/resources/${resource.id}`}>
              View details
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
          {bookable ? (
            <Button asChild size="sm" className="flex-1">
              <Link href={`/bookings/new?resourceId=${resource.id}`}>
                Book now
              </Link>
            </Button>
          ) : (
            <Button size="sm" className="flex-1" disabled>
              Unavailable
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
