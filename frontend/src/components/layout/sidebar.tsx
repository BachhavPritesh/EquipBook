"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Building2, ShieldCheck } from "lucide-react";

import { BrandMark } from "@/components/shared/brand-mark";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  getNavGroups,
  isNavItemActive,
  type NavGroup,
  type PortalKind,
} from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-provider";
import { canUseAdminPortal } from "@/lib/auth";
import { useState } from "react";

function SidebarNav({
  groups,
  onNavigate,
}: {
  groups: NavGroup[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 scrollbar-thin">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    {active ? (
                      <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-indigo-600" />
                    ) : null}
                    <Icon
                      className={cn(
                        "size-[17px]",
                        active
                          ? "text-indigo-600"
                          : "text-slate-400 group-hover:text-slate-600",
                      )}
                      strokeWidth={1.8}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ portal }: { portal: PortalKind }) {
  const { currentUser } = useApp();
  const canUseAdmin = canUseAdminPortal(currentUser.role);
  const isAdmin = portal === "admin";
  const showPortalSwitch = isAdmin || canUseAdmin;

  return (
    <div className="space-y-3 border-t border-slate-100 p-3">
      {showPortalSwitch ? (
        <Link
          href={isAdmin ? "/dashboard" : "/admin/dashboard"}
          className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2.5 text-[12px] font-medium text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <span className="flex size-6 items-center justify-center rounded-md bg-white text-slate-500 shadow-xs">
            {isAdmin ? (
              <ArrowLeftRight className="size-3.5" />
            ) : (
              <ShieldCheck className="size-3.5" />
            )}
          </span>
          <span className="flex-1">
            {isAdmin ? "Open user portal" : "Open admin portal"}
          </span>
          <ArrowLeftRight className="size-3 text-slate-400" />
        </Link>
      ) : null}
      <p className="px-1 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-300">
        Shared catalogue · Local bookings
      </p>
    </div>
  );
}

function SidebarHeader({ portal }: { portal: PortalKind }) {
  return (
    <div className="border-b border-slate-100 p-4">
      <BrandMark href={portal === "admin" ? "/admin/dashboard" : "/dashboard"} />
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-2">
        <span className="flex size-6 items-center justify-center rounded-md bg-white text-indigo-600 shadow-xs">
          <Building2 className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold text-slate-700">
            Northbridge University
          </p>
          <p className="truncate text-[10px] text-slate-400">
            {portal === "admin" ? "Resource operations" : "User workspace"}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
            portal === "admin"
              ? "bg-indigo-100 text-indigo-700"
              : "bg-emerald-100 text-emerald-700",
          )}
        >
          {portal === "admin" ? "Admin" : "User"}
        </span>
      </div>
    </div>
  );
}

export function Sidebar({ portal }: { portal: PortalKind }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-white lg:flex">
      <SidebarHeader portal={portal} />
      <SidebarNav groups={getNavGroups(portal)} />
      <SidebarFooter portal={portal} />
    </aside>
  );
}

export function MobileSidebar({ portal }: { portal: PortalKind }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="size-5"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </Button>
      </SheetTrigger>
      <SheetContent className="p-0">
        <SidebarHeader portal={portal} />
        <SidebarNav
          groups={getNavGroups(portal)}
          onNavigate={() => setOpen(false)}
        />
        <SidebarFooter portal={portal} />
      </SheetContent>
    </Sheet>
  );
}
