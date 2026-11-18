import { Badge } from "@/components/ui/badge";
import {
  BOOKING_STATUS_META,
  CONDITION_META,
  RETURN_STATUS_META,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/booking";
import type { ItemCondition, ReturnRecord } from "@/types/return";
import { getEffectiveReturnStatus } from "@/services/return.service";
import type { Resource } from "@/types/resource";
import { getResourceAvailabilityLabel } from "@/services/resource.service";

export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  const meta = BOOKING_STATUS_META[status];
  return (
    <Badge className={cn("border font-medium", meta.badgeClass, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {meta.label}
    </Badge>
  );
}

export function ResourceAvailabilityBadge({
  resource,
  className,
}: {
  resource: Resource;
  className?: string;
}) {
  const label = getResourceAvailabilityLabel(resource);
  const meta =
    label === "Maintenance"
      ? {
          badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
          dotClass: "bg-amber-500",
        }
      : label === "Available"
        ? {
            badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
            dotClass: "bg-emerald-500",
          }
        : {
            badgeClass: "border-slate-200 bg-slate-100 text-slate-600",
            dotClass: "bg-slate-400",
          };

  return (
    <Badge className={cn("border font-medium", meta.badgeClass, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {label}
    </Badge>
  );
}

export function ReturnStatusBadge({
  record,
  className,
}: {
  record: ReturnRecord;
  className?: string;
}) {
  const status = getEffectiveReturnStatus(record);
  const meta = RETURN_STATUS_META[status];
  return (
    <Badge className={cn("border font-medium", meta.badgeClass, className)}>
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {meta.label}
    </Badge>
  );
}

export function ConditionBadge({
  condition,
  className,
}: {
  condition: ItemCondition;
  className?: string;
}) {
  const meta = CONDITION_META[condition];
  return (
    <Badge className={cn("border font-medium", meta.badgeClass, className)}>
      {meta.label}
    </Badge>
  );
}
