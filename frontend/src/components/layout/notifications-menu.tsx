"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  CircleAlert,
  ClipboardCheck,
  PackageCheck,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-provider";
import { BOOKING_STATUS_META } from "@/lib/constants";
import { formatDate, formatDateRange } from "@/lib/utils";
import type { PortalKind } from "@/config/navigation";
import { getEffectiveReturnStatus } from "@/services/return.service";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  date: string;
  href: string;
  icon: typeof Bell;
  tone: "indigo" | "amber" | "rose" | "emerald";
}

const TONE_CLASSES = {
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  emerald: "bg-emerald-50 text-emerald-600",
};

export function NotificationsMenu({ portal }: { portal: PortalKind }) {
  const { currentUser, bookings, resources, returns, users } = useApp();
  const [unread, setUnread] = useState(true);
  const isAdmin = portal === "admin";

  const items: NotificationItem[] = isAdmin
    ? [
        ...bookings
          .filter((booking) => booking.status === "pending")
          .slice(0, 3)
          .map((booking) => {
            const user = users.find((item) => item.id === booking.userId);
            const resource = resources.find(
              (item) => item.id === booking.resourceId,
            );
            return {
              id: `request-${booking.id}`,
              title: `New request from ${user?.name ?? "a user"}`,
              description: `${resource?.name ?? "Resource"} · ${formatDateRange(booking.startDate, booking.endDate)}`,
              date: booking.createdAt,
              href: "/admin/requests",
              icon: ClipboardCheck,
              tone: "amber" as const,
            };
          }),
        ...returns
          .filter(
            (record) =>
              record.status === "issued" &&
              getEffectiveReturnStatus(record) === "overdue",
          )
          .slice(0, 2)
          .map((record) => {
            const booking = bookings.find(
              (item) => item.id === record.bookingId,
            );
            const resource = resources.find(
              (item) => item.id === booking?.resourceId,
            );
            return {
              id: `overdue-${record.id}`,
              title: "Overdue return",
              description: `${resource?.name ?? "Equipment"} was due ${formatDate(record.expectedReturnDate)}`,
              date: record.expectedReturnDate,
              href: "/admin/returns",
              icon: CircleAlert,
              tone: "rose" as const,
            };
          }),
      ]
    : bookings
        .filter(
          (booking) =>
            booking.userId === currentUser.id &&
            (booking.status === "approved" ||
              booking.status === "rejected" ||
              booking.status === "pending"),
        )
        .sort(
          (a, b) =>
            new Date(b.decisionAt ?? b.createdAt).getTime() -
            new Date(a.decisionAt ?? a.createdAt).getTime(),
        )
        .slice(0, 4)
        .map((booking) => {
          const resource = resources.find(
            (item) => item.id === booking.resourceId,
          );
          const meta = BOOKING_STATUS_META[booking.status];
          return {
            id: booking.id,
            title: `${booking.bookingReference} ${meta.label.toLowerCase()}`,
            description: resource?.name ?? "Resource",
            date: booking.decisionAt ?? booking.createdAt,
            href: `/my-bookings/${booking.id}`,
            icon: booking.status === "approved" ? PackageCheck : Bell,
            tone:
              booking.status === "approved"
                ? ("emerald" as const)
                : booking.status === "rejected"
                  ? ("rose" as const)
                  : ("amber" as const),
          };
        });

  const hasUnread = unread && items.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${hasUnread ? " (unread)" : ""}`}
        >
          <Bell className="size-[18px]" />
          {hasUnread ? (
            <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-rose-500" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] p-0">
        <div className="flex items-center justify-between px-3.5 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Notifications
            </p>
            <p className="text-[11px] text-slate-400">
              {items.length > 0
                ? `${items.length} update${items.length === 1 ? "" : "s"}`
                : "You are all caught up"}
            </p>
          </div>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={() => setUnread(false)}
              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              <CheckCheck className="size-3.5" />
              Mark read
            </button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="mx-0 my-0" />
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="mx-auto size-5 text-slate-300" />
            <p className="mt-2 text-xs text-slate-400">
              New activity will appear here.
            </p>
          </div>
        ) : (
          <div className="max-h-[320px] overflow-y-auto p-1.5 scrollbar-thin">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.id}
                  asChild
                  className="items-start py-2.5"
                >
                  <Link href={item.href}>
                    <span
                      className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${TONE_CLASSES[item.tone]}`}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium text-slate-800">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                        {item.description}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-400">
                        {formatDate(item.date)}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
        <DropdownMenuSeparator className="mx-0 my-0" />
        <div className="p-1.5">
          <DropdownMenuItem asChild>
            <Link
              href={isAdmin ? "/admin/requests" : "/my-bookings"}
              className="justify-center text-[12px] font-medium text-indigo-600 focus:text-indigo-700"
            >
              View all activity
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
