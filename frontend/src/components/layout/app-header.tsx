"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { GlobalSearch } from "@/components/layout/global-search";
import { MobileSidebar } from "@/components/layout/sidebar";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { getBreadcrumbs, type PortalKind } from "@/config/navigation";

export function AppHeader({ portal }: { portal: PortalKind }) {
  const pathname = usePathname();
  const crumbs = getBreadcrumbs(pathname, portal);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <MobileSidebar portal={portal} />
      <nav
        aria-label="Breadcrumb"
        className="hidden min-w-0 items-center gap-1.5 md:flex"
      >
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <span
              key={`${crumb}-${index}`}
              className="flex min-w-0 items-center gap-1.5"
            >
              {index > 0 ? (
                <ChevronRight className="size-3 shrink-0 text-slate-300" />
              ) : null}
              <span
                className={
                  isLast
                    ? "truncate text-[12px] font-medium text-slate-700"
                    : "truncate text-[12px] text-slate-400"
                }
              >
                {crumb}
              </span>
            </span>
          );
        })}
      </nav>
      <p className="truncate text-[12px] font-medium text-slate-700 md:hidden">
        {crumbs[crumbs.length - 1]}
      </p>
      <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
        <GlobalSearch portal={portal} />
        <NotificationsMenu portal={portal} />
        <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
        <ProfileMenu portal={portal} />
      </div>
    </header>
  );
}
