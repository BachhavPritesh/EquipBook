import { clsx, type ClassValue } from "clsx";
import {
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getTodayKey(): string {
  return toDateKey(startOfDay(new Date()));
}

export function formatDate(value: string): string {
  const date = parseISO(value);
  return isValid(date) ? format(date, "MMM d, yyyy") : "—";
}

export function formatDateShort(value: string): string {
  const date = parseISO(value);
  return isValid(date) ? format(date, "MMM d") : "—";
}

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = parseISO(value);
  return isValid(date) ? format(date, "MMM d, yyyy · h:mm a") : "—";
}

export function formatTime(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  return format(new Date(2000, 0, 1, hours, minutes), "h:mm a");
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (!isValid(start) || !isValid(end)) return "—";
  if (startDate === endDate) return format(start, "MMM d, yyyy");
  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  }
  return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

export function daysFromToday(value: string): number {
  const date = parseISO(value);
  if (!isValid(date)) return 0;
  return differenceInCalendarDays(date, startOfDay(new Date()));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function percent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}
