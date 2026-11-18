import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  History,
  LayoutDashboard,
  Package,
  PackageCheck,
  Settings,
  Tags,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type PortalKind = "user" | "admin";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const USER_NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Browse resources", href: "/resources", icon: Package },
      { label: "My bookings", href: "/my-bookings", icon: ClipboardList },
      { label: "Availability", href: "/availability", icon: CalendarDays },
      { label: "Booking history", href: "/history", icon: History },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: UserRound },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Resource inventory", href: "/admin/resources", icon: Package },
      {
        label: "Booking requests",
        href: "/admin/requests",
        icon: ClipboardCheck,
      },
      { label: "All bookings", href: "/admin/bookings", icon: ClipboardList },
      { label: "Availability", href: "/admin/calendar", icon: CalendarDays },
      {
        label: "Issue & returns",
        href: "/admin/returns",
        icon: PackageCheck,
      },
      { label: "Usage analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Configuration",
    items: [
      { label: "Categories", href: "/admin/categories", icon: Tags },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

const SPECIAL_PAGES: Record<string, string> = {
  "/bookings/new": "New booking",
  "/admin/dashboard": "Dashboard",
  "/dashboard": "Overview",
};

export function getNavGroups(portal: PortalKind): NavGroup[] {
  return portal === "admin" ? ADMIN_NAV_GROUPS : USER_NAV_GROUPS;
}

export function getActiveNavItem(
  pathname: string,
  groups: NavGroup[],
): NavItem | undefined {
  return groups
    .flatMap((group) => group.items)
    .filter(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
}

export function getNavGroupForPath(
  pathname: string,
  groups: NavGroup[],
): NavGroup | undefined {
  return groups.find((group) =>
    group.items.some(
      (item) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    ),
  );
}

export function getBreadcrumbs(
  pathname: string,
  portal: PortalKind,
): string[] {
  const groups = getNavGroups(portal);
  const root = portal === "admin" ? "Admin" : "Workspace";
  const active = getActiveNavItem(pathname, groups);
  const crumbs = [root];

  if (active) {
    crumbs.push(active.label);
  } else if (SPECIAL_PAGES[pathname]) {
    crumbs.push(SPECIAL_PAGES[pathname]);
  }

  if (pathname.startsWith("/resources/") && pathname !== "/resources") {
    crumbs.push("Resource details");
  } else if (
    pathname.startsWith("/my-bookings/") &&
    pathname !== "/my-bookings"
  ) {
    crumbs.push("Booking details");
  } else if (pathname === "/bookings/new") {
    crumbs.push("New booking");
  }

  return crumbs;
}

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
