"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  CircleAlert,
  Percent,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/context/app-provider";
import { cn, formatNumber, pluralize } from "@/lib/utils";
import {
  getAnalyticsSummary,
  getBookingTrend,
  getCategoryBookingDistribution,
  getStatusDistribution,
  getTopResources,
  getUtilizationByCategory,
} from "@/services/analytics.service";

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
};

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[12px] text-slate-400">
      {message}
    </div>
  );
}

export function AdminAnalyticsPage() {
  const { bookings, resources, categories, returns } = useApp();
  const [months, setMonths] = useState(6);

  const summary = getAnalyticsSummary(bookings, resources, returns);
  const trend = getBookingTrend(bookings, months);
  const statusDistribution = getStatusDistribution(bookings).filter(
    (item) => item.value > 0,
  );
  const categoryBookings = getCategoryBookingDistribution(
    bookings,
    resources,
    categories,
  );
  const utilization = getUtilizationByCategory(
    resources,
    categories,
    bookings,
  );
  const topResources = getTopResources(bookings, resources, 6);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Analytics"
        title="Usage analytics"
        description="Understand demand, approval throughput, and how much of the shared inventory is in active use."
        actions={
          <Select
            value={String(months)}
            onValueChange={(value) => setMonths(Number(value))}
          >
            <SelectTrigger className="w-40" aria-label="Trend period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total bookings"
          value={formatNumber(summary.totalBookings)}
          hint={`${summary.completedBookings} completed`}
          icon={BarChart3}
          accent="indigo"
        />
        <StatCard
          label="Approval rate"
          value={`${summary.approvalRate}%`}
          hint={`${summary.pendingRequests} requests pending`}
          icon={Percent}
          accent="emerald"
        />
        <StatCard
          label="Active utilization"
          value={`${summary.utilizationRate}%`}
          hint="Units reserved against total stock"
          icon={TrendingUp}
          accent="blue"
        />
        <StatCard
          label="Overdue returns"
          value={summary.overdueReturns}
          hint="Follow up with borrowers"
          icon={CircleAlert}
          accent="rose"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Booking trend</CardTitle>
                <p className="text-[12px] text-slate-500">
                  Requests received over the last {months} months
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="size-2 rounded-full bg-indigo-500" />
                All requests
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {trend.every((point) => point.bookings === 0) ? (
              <EmptyChart message="No bookings in this period yet." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bookingFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      width={34}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area
                      type="monotone"
                      dataKey="bookings"
                      name="Bookings"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fill="url(#bookingFill)"
                    />
                    <Area
                      type="monotone"
                      dataKey="fulfilled"
                      name="Fulfilled"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      fill="transparent"
                      strokeDasharray="4 3"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status mix</CardTitle>
            <p className="text-[12px] text-slate-500">
              Distribution across all bookings
            </p>
          </CardHeader>
          <CardContent>
            {statusDistribution.length === 0 ? (
              <EmptyChart message="No booking data yet." />
            ) : (
              <>
                <div className="relative mx-auto h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={76}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {statusDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-xl font-semibold text-slate-900 tabular">
                      {bookings.length}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-slate-400">
                      Bookings
                    </p>
                  </div>
                </div>
                <ul className="mt-3 space-y-2">
                  {statusDistribution.map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between gap-2 text-[11px]"
                    >
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.name}
                      </span>
                      <span className="font-medium text-slate-700 tabular">
                        {item.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bookings by category</CardTitle>
            <p className="text-[12px] text-slate-500">
              Which collections are in demand
            </p>
          </CardHeader>
          <CardContent>
            {categoryBookings.every((item) => item.value === 0) ? (
              <EmptyChart message="No category bookings yet." />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryBookings}
                    layout="vertical"
                    margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      width={118}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar
                      dataKey="value"
                      name="Bookings"
                      fill="#6366f1"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilization by category</CardTitle>
            <p className="text-[12px] text-slate-500">
              Approved units as a share of category stock
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {utilization.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-slate-600">{item.name}</span>
                  <span className="font-medium text-slate-800 tabular">
                    {item.value}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      item.value > 75
                        ? "bg-rose-500"
                        : item.value > 40
                          ? "bg-amber-500"
                          : "bg-indigo-500",
                    )}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Top resources</CardTitle>
              <p className="text-[12px] text-slate-500">
                Most requested equipment, excluding declined and cancelled
                bookings
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <a href="/admin/resources">Manage inventory</a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0 sm:px-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/60 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-2.5 text-left font-semibold sm:px-6">
                    Resource
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold">
                    Bookings
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold">
                    Units
                  </th>
                  <th className="px-5 py-2.5 text-right font-semibold sm:px-6">
                    Utilization
                  </th>
                </tr>
              </thead>
              <tbody>
                {topResources.map((resource) => (
                  <tr
                    key={resource.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-5 py-3 text-[12px] font-medium text-slate-700 sm:px-6">
                      {resource.name}
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] text-slate-600 tabular">
                      {resource.bookings}
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] text-slate-600 tabular">
                      {resource.quantity}
                    </td>
                    <td className="px-5 py-3 text-right sm:px-6">
                      <span className="inline-flex items-center gap-2">
                        <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 sm:block">
                          <span
                            className="block h-full rounded-full bg-indigo-500"
                            style={{ width: `${resource.utilization}%` }}
                          />
                        </span>
                        <span className="text-[11px] font-medium text-slate-700 tabular">
                          {resource.utilization}%
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-5 py-3 text-[10px] text-slate-400 sm:px-6">
            {pluralize(bookings.length, "booking")} included in this analysis
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
