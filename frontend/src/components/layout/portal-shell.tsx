"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";

import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PortalKind } from "@/config/navigation";
import { useApp } from "@/context/app-provider";
import { useAuth } from "@/context/auth-provider";
import { canUseAdminPortal, getPortalPath } from "@/lib/auth";

function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading workspace">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

function WorkspaceError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-rose-200 bg-white p-6 text-center shadow-sm">
        <AlertCircle className="mx-auto size-8 text-rose-500" />
        <h2 className="mt-3 text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{message}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={onRetry}
        >
          <RefreshCw className="size-4" />
          Try again
        </Button>
      </div>
    </div>
  );
}

export function PortalShell({
  portal,
  children,
}: {
  portal: PortalKind;
  children: ReactNode;
}) {
  const router = useRouter();
  const {
    isHydrated,
    isCatalogueLoading,
    catalogueError,
    refreshCatalogue,
  } = useApp();
  const { user, status, retry } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (
      status === "authenticated" &&
      user &&
      portal === "admin" &&
      !canUseAdminPortal(user.role)
    ) {
      router.replace(getPortalPath(user.role));
    }
  }, [status, user, portal, router]);

  const isAuthorized = status === "authenticated" && user !== null;
  const isAdminAllowed =
    portal !== "admin" || (user ? canUseAdminPortal(user.role) : false);
  const isReady =
    isHydrated &&
    isAuthorized &&
    isAdminAllowed &&
    !isCatalogueLoading;

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Sidebar portal={portal} />
      <div className="lg:pl-64">
        <AppHeader portal={portal} />
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {status === "error" ? (
            <WorkspaceError
              title="We couldn't restore your session"
              message="Check that the backend is running, then try again."
              onRetry={retry}
            />
          ) : isAuthorized && catalogueError ? (
            <WorkspaceError
              title="Catalogue unavailable"
              message={catalogueError}
              onRetry={() => {
                void refreshCatalogue();
              }}
            />
          ) : isReady ? (
            children
          ) : (
            <PageSkeleton />
          )}
        </main>
      </div>
    </div>
  );
}
