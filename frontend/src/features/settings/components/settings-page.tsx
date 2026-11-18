"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellRing,
  CalendarClock,
  LayoutPanelLeft,
  Mail,
  Moon,
  RotateCcw,
  Sun,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/context/app-provider";
import type { UserPreferences } from "@/types/user";

const PREFERENCE_ROWS: {
  key: keyof UserPreferences;
  label: string;
  description: string;
  icon: typeof BellRing;
}[] = [
  {
    key: "bookingUpdates",
    label: "Booking updates",
    description:
      "Approval, rejection, and cancellation updates for your requests.",
    icon: BellRing,
  },
  {
    key: "returnReminders",
    label: "Return reminders",
    description:
      "A reminder before equipment is due back at the resource desk.",
    icon: CalendarClock,
  },
  {
    key: "weeklyDigest",
    label: "Weekly digest",
    description:
      "A short summary of your bookings and new catalogue additions.",
    icon: Mail,
  },
  {
    key: "compactTables",
    label: "Compact tables",
    description:
      "Use tighter row spacing in booking tables to fit more on screen.",
    icon: LayoutPanelLeft,
  },
];

export function SettingsPage() {
  const { currentUser, preferences, updatePreferences, resetDemoData } =
    useApp();
  const router = useRouter();
  const [resetOpen, setResetOpen] = useState(false);

  const handleReset = () => {
    resetDemoData();
    setResetOpen(false);
    toast.success("Local demo data restored.");
    router.push("/dashboard");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Choose how EquipBook keeps you informed. Preferences save automatically to this browser."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <p className="text-sm text-slate-500">
                These switches only affect what this demo would notify you
                about. No emails are sent.
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
                          htmlFor={row.key}
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
                      id={row.key}
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

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <p className="text-sm text-slate-500">
                EquipBook currently uses a light workspace theme.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                    <Sun className="size-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-slate-800">
                      Light
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Current theme
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 opacity-60">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                    <Moon className="size-4" />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-slate-600">
                      Dark
                    </p>
                    <p className="text-[11px] text-slate-400">Coming later</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[12px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Name</span>
                <span className="text-right font-medium text-slate-700">
                  {currentUser.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">Email</span>
                <span className="max-w-44 truncate text-right font-medium text-slate-700">
                  {currentUser.email}
                </span>
              </div>
              <Button asChild variant="outline" className="mt-2 w-full">
                <Link href="/profile">
                  <UserRound className="size-4" />
                  Edit profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-rose-200">
            <CardHeader>
              <CardTitle className="text-rose-700">Local demo</CardTitle>
              <p className="text-sm text-slate-500">
                Bookings, returns, and preferences live in this browser.
                Resetting restores the sample bookings and returns without
                changing the shared catalogue.
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
              <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
                Your local bookings and returns will be removed. Your account
                stays.
              </p>
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
