import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";

import {
  BOOKING_STATUS_META,
  BOOKING_STATUSES,
} from "@/lib/constants";
import { toDateKey } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import type { Category } from "@/types/category";
import type { Resource } from "@/types/resource";
import type { ReturnRecord } from "@/types/return";
import { getReturnStats } from "./return.service";

export interface BookingTrendPoint {
  month: string;
  bookings: number;
  fulfilled: number;
}

export interface ChartDatum {
  name: string;
  value: number;
  color?: string;
}

export interface ResourceBookingDatum {
  id: string;
  name: string;
  bookings: number;
  quantity: number;
  utilization: number;
}

export function getBookingTrend(
  bookings: Booking[],
  months = 6,
): BookingTrendPoint[] {
  const end = endOfMonth(new Date());
  const start = startOfMonth(subMonths(end, months - 1));

  return eachMonthOfInterval({ start, end }).map((month) => {
    const monthBookings = bookings.filter((booking) => {
      const date = parseISO(booking.startDate);
      return isSameMonth(date, month);
    });

    return {
      month: format(month, "MMM"),
      bookings: monthBookings.length,
      fulfilled: monthBookings.filter(
        (booking) =>
          booking.status === "approved" || booking.status === "completed",
      ).length,
    };
  });
}

export function getStatusDistribution(bookings: Booking[]): ChartDatum[] {
  return BOOKING_STATUSES.map((status) => ({
    name: BOOKING_STATUS_META[status].label,
    value: bookings.filter((booking) => booking.status === status).length,
    color: BOOKING_STATUS_META[status].chartColor,
  }));
}

export function getCategoryBookingDistribution(
  bookings: Booking[],
  resources: Resource[],
  categories: Category[],
): ChartDatum[] {
  const resourceCategory = new Map(
    resources.map((resource) => [resource.id, resource.categoryId]),
  );

  return categories.map((category) => {
    const bookingCount = bookings.filter((booking) => {
      const categoryId = resourceCategory.get(booking.resourceId);
      return categoryId === category.id;
    }).length;

    return { name: category.name, value: bookingCount };
  });
}

export function getCategoryResourceDistribution(
  resources: Resource[],
  categories: Category[],
): ChartDatum[] {
  return categories.map((category) => ({
    name: category.name,
    value: resources.filter((resource) => resource.categoryId === category.id)
      .length,
  }));
}

export function getUtilizationByCategory(
  resources: Resource[],
  categories: Category[],
  bookings: Booking[],
): ChartDatum[] {
  const today = toDateKey(new Date());

  return categories.map((category) => {
    const categoryResources = resources.filter(
      (resource) => resource.categoryId === category.id,
    );
    const totalUnits = categoryResources.reduce(
      (total, resource) => total + resource.totalQuantity,
      0,
    );
    const activeUnits = categoryResources.reduce((total, resource) => {
      const reserved = bookings
        .filter(
          (booking) =>
            booking.resourceId === resource.id &&
            booking.status === "approved" &&
            booking.endDate >= today,
        )
        .reduce((sum, booking) => sum + booking.quantity, 0);
      return total + reserved;
    }, 0);

    return {
      name: category.name,
      value:
        totalUnits > 0
          ? Math.min(100, Math.round((activeUnits / totalUnits) * 100))
          : 0,
    };
  });
}

export function getTopResources(
  bookings: Booking[],
  resources: Resource[],
  limit = 6,
): ResourceBookingDatum[] {
  const counts = new Map<string, { bookings: number; quantity: number }>();

  bookings
    .filter(
      (booking) =>
        booking.status !== "rejected" && booking.status !== "cancelled",
    )
    .forEach((booking) => {
      const current = counts.get(booking.resourceId) ?? {
        bookings: 0,
        quantity: 0,
      };
      counts.set(booking.resourceId, {
        bookings: current.bookings + 1,
        quantity: current.quantity + booking.quantity,
      });
    });

  return [...counts.entries()]
    .map(([resourceId, count]) => {
      const resource = resources.find((item) => item.id === resourceId);
      return {
        id: resourceId,
        name: resource?.name ?? "Unknown resource",
        bookings: count.bookings,
        quantity: count.quantity,
        utilization: resource
          ? Math.min(
              100,
              Math.round((count.quantity / resource.totalQuantity) * 100),
            )
          : 0,
      };
    })
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, limit);
}

export interface AnalyticsSummary {
  totalBookings: number;
  approvalRate: number;
  utilizationRate: number;
  pendingRequests: number;
  overdueReturns: number;
  completedBookings: number;
}

export function getAnalyticsSummary(
  bookings: Booking[],
  resources: Resource[],
  returns: ReturnRecord[],
): AnalyticsSummary {
  const approved = bookings.filter(
    (booking) => booking.status === "approved" || booking.status === "completed",
  ).length;
  const rejected = bookings.filter(
    (booking) => booking.status === "rejected",
  ).length;
  const decided = approved + rejected;

  const totalUnits = resources.reduce(
    (total, resource) => total + resource.totalQuantity,
    0,
  );
  const currentlyReserved = bookings
    .filter(
      (booking) =>
        booking.status === "approved" &&
        booking.endDate >= toDateKey(new Date()),
    )
    .reduce((total, booking) => total + booking.quantity, 0);
  const returnStats = getReturnStats(returns);

  return {
    totalBookings: bookings.length,
    approvalRate:
      decided > 0 ? Math.round((approved / decided) * 100) : 0,
    utilizationRate:
      totalUnits > 0
        ? Math.min(100, Math.round((currentlyReserved / totalUnits) * 100))
        : 0,
    pendingRequests: bookings.filter((booking) => booking.status === "pending")
      .length,
    overdueReturns: returnStats.overdue,
    completedBookings: bookings.filter(
      (booking) => booking.status === "completed",
    ).length,
  };
}
