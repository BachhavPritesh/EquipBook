"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Package,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookingStatusBadge } from "@/components/shared/status-badge";
import {
  getNavGroups,
  type PortalKind,
} from "@/config/navigation";
import { useApp } from "@/context/app-provider";
import { formatDateRange } from "@/lib/utils";
import { getBookingSearchText } from "@/services/booking.service";

export function GlobalSearch({ portal }: { portal: PortalKind }) {
  const router = useRouter();
  const { resources, bookings, categories, users, currentUser } = useApp();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isAdmin = portal === "admin";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const normalized = query.trim().toLowerCase();

  const resourceResults = useMemo(() => {
    const visible = resources
      .filter((resource) =>
        isAdmin ? true : resource.status !== "unavailable",
      )
      .filter((resource) => {
        if (!normalized) return true;
        const category = categories.find(
          (item) => item.id === resource.categoryId,
        );
        return [
          resource.name,
          resource.assetTag,
          resource.location,
          resource.description,
          category?.name ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      });
    return visible.slice(0, normalized ? 4 : 3);
  }, [resources, categories, normalized, isAdmin]);

  const bookingResults = useMemo(() => {
    if (!normalized) return [];
    return bookings
      .filter((booking) => (isAdmin ? true : booking.userId === currentUser.id))
      .filter((booking) =>
        getBookingSearchText(booking, resources, users).includes(normalized),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 4);
  }, [
    bookings,
    normalized,
    isAdmin,
    currentUser.id,
    resources,
    users,
  ]);

  const quickLinks = useMemo(() => {
    const items = getNavGroups(portal).flatMap((group) => group.items);
    return items.slice(0, isAdmin ? 4 : 5);
  }, [portal, isAdmin]);

  const closeAndNavigate = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const hasResults =
    resourceResults.length > 0 || bookingResults.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 items-center gap-2 rounded-lg border border-input bg-slate-50/80 px-3 text-left text-[13px] text-slate-400 transition-colors hover:border-slate-300 hover:bg-white sm:flex sm:w-56 lg:w-64"
        aria-label="Open global search"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate">Search resources, bookings…</span>
        <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[9px] font-medium text-slate-400">
          ⌘K
        </kbd>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="sm:hidden"
        aria-label="Open global search"
      >
        <Search className="size-[18px]" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showClose={false}
          className="top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
        >
          <DialogTitle className="sr-only">Search EquipBook</DialogTitle>
          <DialogDescription className="sr-only">
            Search for resources, bookings, and workspace pages.
          </DialogDescription>
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-4">
            <Search className="size-4 shrink-0 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search resources, bookings, pages…"
              className="h-14 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              aria-label="Search resources, bookings, and pages"
            />
            <kbd className="shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
              ESC
            </kbd>
          </div>

          <div className="max-h-[60dvh] overflow-y-auto p-2 scrollbar-thin">
            {!normalized ? (
              <div className="mb-1">
                <p className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Quick links
                </p>
                <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                  {quickLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => closeAndNavigate(item.href)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Icon className="size-4 text-slate-400" />
                        <span className="flex-1 truncate">{item.label}</span>
                        <ArrowUpRight className="size-3 text-slate-300" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {resourceResults.length > 0 ? (
              <div className="mt-1">
                <p className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Resources
                </p>
                <div className="space-y-0.5">
                  {resourceResults.map((resource) => {
                    const category = categories.find(
                      (item) => item.id === resource.categoryId,
                    );
                    return (
                      <button
                        key={resource.id}
                        type="button"
                        onClick={() =>
                          closeAndNavigate(`/resources/${resource.id}`)
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500">
                          <Package className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-slate-800">
                            {resource.name}
                          </span>
                          <span className="block truncate text-[11px] text-slate-400">
                            {category?.name} · {resource.location} ·{" "}
                            {resource.availableQuantity}/
                            {resource.totalQuantity} available
                          </span>
                        </span>
                        <span className="font-mono text-[9px] text-slate-300">
                          {resource.assetTag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {bookingResults.length > 0 ? (
              <div className="mt-1">
                <p className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Bookings
                </p>
                <div className="space-y-0.5">
                  {bookingResults.map((booking) => {
                    const resource = resources.find(
                      (item) => item.id === booking.resourceId,
                    );
                    const user = users.find(
                      (item) => item.id === booking.userId,
                    );
                    return (
                      <button
                        key={booking.id}
                        type="button"
                        onClick={() =>
                          closeAndNavigate(
                            isAdmin
                              ? `/admin/bookings?ref=${booking.bookingReference}`
                              : `/my-bookings/${booking.id}`,
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-50"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-500">
                          <ClipboardList className="size-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-slate-800">
                            {booking.bookingReference} ·{" "}
                            {resource?.name ?? "Deleted resource"}
                          </span>
                          <span className="block truncate text-[11px] text-slate-400">
                            {user?.name} ·{" "}
                            {formatDateRange(
                              booking.startDate,
                              booking.endDate,
                            )}
                          </span>
                        </span>
                        <BookingStatusBadge
                          status={booking.status}
                          className="hidden sm:inline-flex"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {normalized && !hasResults ? (
              <div className="px-4 py-10 text-center">
                <Search className="mx-auto size-5 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  No matches for “{query.trim()}”
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Try a resource name, asset tag, or booking reference.
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3" />
              {isAdmin ? "Admin workspace" : "Student workspace"}
            </span>
            <span className="flex items-center gap-1">
              <LayoutDashboard className="size-3" />
              Press ⌘K anytime
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
