"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useApp } from "@/context/app-provider";
import { useAuth } from "@/context/auth-provider";
import { canUseAdminPortal } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import type { PortalKind } from "@/config/navigation";

export function ProfileMenu({ portal }: { portal: PortalKind }) {
  const router = useRouter();
  const { currentUser, adminUser } = useApp();
  const { logout } = useAuth();
  const user = portal === "admin" ? adminUser : currentUser;
  const isAdmin = portal === "admin";
  const canUseAdmin = canUseAdminPortal(user.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open profile menu"
        >
          <UserAvatar user={user} className="size-8" />
          <span className="hidden min-w-0 text-left md:block">
            <span className="block max-w-28 truncate text-[12px] font-semibold leading-tight text-slate-800">
              {user.name}
            </span>
            <span className="block max-w-28 truncate text-[10px] leading-tight text-slate-400">
              {ROLE_LABELS[user.role]}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="normal-case tracking-normal">
          <span className="block text-[13px] font-semibold text-slate-900">
            {user.name}
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-normal text-slate-400">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={isAdmin ? "/admin/settings" : "/profile"}>
            <UserRound />
            {isAdmin ? "Admin settings" : "Profile"}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={isAdmin ? "/admin/settings" : "/settings"}>
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        {isAdmin || canUseAdmin ? (
          <DropdownMenuItem asChild>
            <Link href={isAdmin ? "/dashboard" : "/admin/dashboard"}>
              <ArrowLeftRight />
              {isAdmin ? "Open user portal" : "Open admin portal"}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            logout();
            router.replace("/login");
          }}
          className="text-rose-600 focus:bg-rose-50"
        >
          <LogOut className="text-rose-500" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
