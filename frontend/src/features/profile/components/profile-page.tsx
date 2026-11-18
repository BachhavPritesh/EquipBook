"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeCheck,
  ClipboardList,
  PackageCheck,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context/app-provider";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { getBookingStats } from "@/services/booking.service";
import {
  profileSchema,
  type ProfileFormSchema,
} from "../utils/profile-schema";

export function ProfilePage() {
  const { currentUser, bookings, returns, updateUser } = useApp();
  const stats = getBookingStats(bookings, currentUser.id);
  const itemsInHand = returns.reduce((total, record) => {
    if (record.status !== "issued") return total;
    const booking = bookings.find((item) => item.id === record.bookingId);
    if (!booking || booking.userId !== currentUser.id) return total;
    return total + (record.issuedQuantity - record.returnedQuantity);
  }, 0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser.name,
      department: currentUser.department,
      phone: currentUser.phone,
    },
  });

  const onSubmit = async (values: ProfileFormSchema) => {
    const result = await updateUser(currentUser.id, values);
    if (result.success) {
      toast.success(result.message);
      reset(values);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="Keep your contact details current so resource managers can reach you about collections and returns."
        actions={
          <Button asChild variant="outline">
            <Link href="/settings">
              <Settings className="size-4" />
              Preferences
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
          <div className="flex items-center gap-4">
            <UserAvatar user={currentUser} className="size-16 text-lg" />
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                {currentUser.name}
              </h2>
              <p className="mt-0.5 text-[13px] text-slate-500">
                {currentUser.email}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                  <BadgeCheck className="size-3" />
                  {ROLE_LABELS[currentUser.role]}
                </span>
                <span className="text-[11px] text-slate-400">
                  {currentUser.department || "Not set"}
                </span>
              </div>
            </div>
          </div>
          <p className="max-w-xs text-[11px] leading-5 text-slate-400">
            Profile photo uses your initials. Photo upload is not part of this
            release.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
            <p className="text-sm text-slate-500">
              Changes are saved to your account.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                label="Full name"
                htmlFor="name"
                required
                error={errors.name?.message}
              >
                <Input
                  id="name"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  {...register("name")}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Department (optional)"
                  htmlFor="department"
                  error={errors.department?.message}
                >
                  <Input
                    id="department"
                    autoComplete="organization"
                    aria-invalid={Boolean(errors.department)}
                    {...register("department")}
                  />
                </FormField>
                <FormField
                  label="Phone number (optional)"
                  htmlFor="phone"
                  error={errors.phone?.message}
                >
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    aria-invalid={Boolean(errors.phone)}
                    {...register("phone")}
                  />
                </FormField>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="size-3.5" />
                  Your profile is stored securely with your account.
                </p>
                <Button type="submit" disabled={isSubmitting}>
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Account overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="text-slate-400">Member ID</span>
              <span className="font-mono text-[11px] text-slate-600">
                {currentUser.id}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="text-slate-400">Role</span>
              <span className="font-medium text-slate-700">
                {ROLE_LABELS[currentUser.role]}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="text-slate-400">Department</span>
              <span className="text-right font-medium text-slate-700">
                {currentUser.department || "Not set"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="text-slate-400">Profile updated</span>
              <span className="font-medium text-slate-700">
                {formatDate(new Date().toISOString())}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <ClipboardList className="size-4 text-indigo-500" />
                <p className="mt-2 text-lg font-semibold text-slate-900 tabular">
                  {stats.total}
                </p>
                <p className="text-[10px] text-slate-400">Total bookings</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <PackageCheck className="size-4 text-emerald-500" />
                <p className="mt-2 text-lg font-semibold text-slate-900 tabular">
                  {itemsInHand}
                </p>
                <p className="text-[10px] text-slate-400">Items in hand</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
