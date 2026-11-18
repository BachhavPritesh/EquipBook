"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  PackageCheck,
  Sparkles,
} from "lucide-react";

import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { UpcomingBookingsCard } from "@/components/dashboard/upcoming-bookings-card";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/app-provider";
import { ResourceCard } from "@/features/resources/components/resource-card";
import {
  getBookingForUser,
  getBookingStats,
  getRecentBookings,
  getUpcomingBookings,
} from "@/services/booking.service";

export function UserDashboard() {
  const { currentUser, bookings, resources, categories, returns } = useApp();
  const userBookings = getBookingForUser(bookings, currentUser.id);
  const stats = getBookingStats(bookings, currentUser.id);
  const upcoming = getUpcomingBookings(bookings, {
    userId: currentUser.id,
    limit: 4,
  });
  const recent = getRecentBookings(bookings, {
    userId: currentUser.id,
    limit: 5,
  });

  const issuedUnits = returns.reduce((total, record) => {
    if (record.status !== "issued") return total;
    const booking = userBookings.find((item) => item.id === record.bookingId);
    if (!booking) return total;
    return total + (record.issuedQuantity - record.returnedQuantity);
  }, 0);

  const nextBooking = upcoming[0];
  const nextResource = nextBooking
    ? resources.find((resource) => resource.id === nextBooking.resourceId)
    : undefined;

  const recentlyAdded = [...resources]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <WelcomeBanner
        user={currentUser}
        nextBooking={nextBooking}
        resource={nextResource}
        issuedUnits={issuedUnits}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total bookings"
          value={stats.total}
          hint={`${stats.completed} completed · ${stats.cancelled} cancelled`}
          icon={ClipboardList}
          accent="indigo"
        />
        <StatCard
          label="Pending requests"
          value={stats.pending}
          hint="Awaiting a resource manager decision"
          icon={Clock3}
          accent="amber"
        />
        <StatCard
          label="Approved bookings"
          value={stats.approved}
          hint={`${stats.upcoming} upcoming collections`}
          icon={CheckCircle2}
          accent="blue"
        />
        <StatCard
          label="Items in hand"
          value={issuedUnits}
          hint={
            issuedUnits > 0
              ? "Return by the expected date"
              : "Nothing issued right now"
          }
          icon={PackageCheck}
          accent="emerald"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingBookingsCard bookings={upcoming} resources={resources} />
        </div>
        <RecentActivityCard bookings={recent} resources={resources} />
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-indigo-600">
              Just landed
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
              <Sparkles className="size-4 text-indigo-500" />
              Recently added resources
            </h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/resources">
              View catalogue
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recentlyAdded.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              category={categories.find(
                (category) => category.id === resource.categoryId,
              )}
            />
          ))}
        </div>
      </section>

      {userBookings.length === 0 ? (
        <PageHeader
          title="Your workspace is ready"
          description="Create your first booking to see live updates here."
          actions={
            <Button asChild>
              <Link href="/resources">Browse resources</Link>
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
