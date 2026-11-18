"use client";

import { useState } from "react";
import {
  BellRing,
  CalendarClock,
  Database,
  Download,
  LayoutPanelLeft,
  Mail,
  MapPin,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/context/app-provider";
import { getTodayKey, pluralize } from "@/lib/utils";
import type { UserPreferences } from "@/types/user";

const PREFERENCE_ROWS: {
  key: keyof UserPreferences;
  label: string;
  description: string;
  icon: typeof BellRing;
}[] = [
  {
    key: "bookingUpdates",
    label: "Booking notifications",
    description:
      "Alert the desk when new requests arrive or someone cancels a collection.",
    icon: BellRing,
  },
  {
    key: "returnReminders",
    label: "Return reminders",
    description:
      "Surface equipment nearing its expected return date in the returns view.",
    icon: CalendarClock,
  },
  {
    key: "weeklyDigest",
    label: "Weekly operations digest",
    description:
      "Summarise demand, approvals, and overdue items once a week.",
    icon: Mail,
  },
  {
    key: "compactTables",
    label: "Compact tables",
    description:
      "Use tighter row spacing in operations tables to fit more records.",
    icon: LayoutPanelLeft,
  },
];

export function AdminSettingsPage() {
  const {
    adminUser,
    preferences,
    updatePreferences,
    resetDemoData,
    resources,
    bookings,
    categories,
    users,
    returns,
  } = useApp();
  const [resetOpen, setResetOpen] = useState(false);

  const handleReset = () => {
    resetDemoData();
    setResetOpen(false);
    toast.success("Local demo data restored.");
  };

  const handleBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      resources,
      bookings,
      categories,
      users,
      returns,
      preferences,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `equipbook-backup-${getTodayKey()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Workspace backup downloaded.");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Configuration"
        title="Workspace settings"
        description="Review the resource desk configuration and manage local demo activity."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Resource desk</CardTitle>
              <p className="text-sm text-slate-500">
                These values are fixed for this release.
              </p>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Organisation
                  </dt>
                  <dd className="mt-1 text-[13px] font-medium text-slate-800">
                    Northbridge University
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Resource desk
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-slate-800">
                    <MapPin className="size-3.5 text-slate-400" />
                    Library Building, Level 2
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Collection hours
                  </dt>
                  <dd className="mt-1 text-[13px] font-medium text-slate-800">
                    Mon–Fri, 9:00 AM – 6:00 PM
                  </dd>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Support email
                  </dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-slate-800">
                    <Mail className="size-3.5 text-slate-400" />
                    resources@northbridge.edu
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification defaults</CardTitle>
              <p className="text-sm text-slate-500">
                Preferences are stored in this browser. No email is sent in the
                demo.
              </p>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100">
              {PREFERENCE_ROWS.map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.key}
                    className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex gap-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <label
                          htmlFor={`admin-${row.key}`}
                          className="text-[13px] font-medium text-slate-800"
                        >
                          {row.label}
                        </label>
                        <p className="mt-0.5 max-w-md text-[11px] leading-5 text-slate-400">
                          {row.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={`admin-${row.key}`}
                      checked={preferences[row.key]}
                      onCheckedChange={(checked) =>
                        updatePreferences({ [row.key]: checked })
                      }
                      aria-label={row.label}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Manager account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <UserAvatar user={adminUser} className="size-11" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-slate-800">
                    {adminUser.name}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {adminUser.email}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[9px] font-medium text-indigo-700">
                    <ShieldCheck className="size-2.5" />
                    Resource manager
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Department</span>
                  <span className="text-right font-medium text-slate-700">
                    {adminUser.department}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Phone</span>
                  <span className="text-right font-medium text-slate-700">
                    {adminUser.phone}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-4 text-indigo-600" />
                Local activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Local storage</span>
                  <span className="font-medium text-slate-700">
                    Browser localStorage
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Records</span>
                  <span className="font-medium text-slate-700">
                    {pluralize(bookings.length, "booking")} ·{" "}
                    {pluralize(returns.length, "return")}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">Catalogue</span>
                  <span className="font-medium text-slate-700">
                    Server-backed
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleBackup}
              >
                <Download className="size-4" />
                Download local backup
              </Button>
              <p className="text-center text-[10px] leading-4 text-slate-400">
                Includes local bookings, returns, preferences, demo users, and a
                snapshot of the server catalogue.
              </p>
            </CardContent>
          </Card>

          <Card className="border-rose-200">
            <CardHeader>
              <CardTitle className="text-rose-700">Reset local demo</CardTitle>
              <p className="text-sm text-slate-500">
                Restore sample bookings and returns. The shared catalogue is not
                changed.
              </p>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw className="size-4" />
                Reset local demo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset local demo data?"
        description="Every local booking, return, and preference in this browser will be discarded. The shared catalogue and your account will not change."
        confirmLabel="Reset local data"
        destructive
        onConfirm={handleReset}
      />
    </div>
  );
}
