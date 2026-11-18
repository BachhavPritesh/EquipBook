import type { BookingStatus } from "@/types/booking";
import type {
  EffectiveReturnStatus,
  ItemCondition,
} from "@/types/return";
import type { ResourceStatus } from "@/types/resource";
import type { UserRole } from "@/types/user";

export const STORAGE_KEY = "equipbook.store";
export const STORAGE_VERSION = 2;
export const CATALOGUE_PAGE_SIZE = 9;
export const TABLE_PAGE_SIZE = 8;

interface StatusMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const BOOKING_STATUS_META: Record<
  BookingStatus,
  StatusMeta & { chartColor: string }
> = {
  pending: {
    label: "Pending",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    dotClass: "bg-amber-500",
    chartColor: "#f59e0b",
  },
  approved: {
    label: "Approved",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    dotClass: "bg-blue-500",
    chartColor: "#3b82f6",
  },
  rejected: {
    label: "Rejected",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    dotClass: "bg-rose-500",
    chartColor: "#f43f5e",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-600",
    dotClass: "bg-slate-400",
    chartColor: "#94a3b8",
  },
  completed: {
    label: "Completed",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
    chartColor: "#10b981",
  },
};

export const RESOURCE_STATUS_META: Record<ResourceStatus, StatusMeta> = {
  available: {
    label: "Available",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
  },
  unavailable: {
    label: "Unavailable",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-600",
    dotClass: "bg-slate-400",
  },
  maintenance: {
    label: "Maintenance",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    dotClass: "bg-amber-500",
  },
};

export const RETURN_STATUS_META: Record<EffectiveReturnStatus, StatusMeta> = {
  ready: {
    label: "Ready to issue",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    dotClass: "bg-blue-500",
  },
  issued: {
    label: "Issued",
    badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-700",
    dotClass: "bg-indigo-500",
  },
  returned: {
    label: "Returned",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
  },
  overdue: {
    label: "Overdue",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    dotClass: "bg-rose-500",
  },
};

export const CONDITION_META: Record<ItemCondition, StatusMeta> = {
  good: {
    label: "Good",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
  },
  "minor-damage": {
    label: "Minor damage",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    dotClass: "bg-amber-500",
  },
  damaged: {
    label: "Damaged",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    dotClass: "bg-rose-500",
  },
  missing: {
    label: "Missing",
    badgeClass: "border-slate-300 bg-slate-100 text-slate-700",
    dotClass: "bg-slate-500",
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  employee: "Employee",
  faculty: "Faculty",
  manager: "Resource manager",
  admin: "Administrator",
};

export const BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "completed",
];

export const CONDITIONS: ItemCondition[] = [
  "good",
  "minor-damage",
  "damaged",
  "missing",
];

export const RESOURCE_STATUSES: ResourceStatus[] = [
  "available",
  "unavailable",
  "maintenance",
];
