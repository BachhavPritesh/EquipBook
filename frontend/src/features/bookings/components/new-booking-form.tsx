"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format, isValid, parseISO, startOfDay } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Info,
  MapPin,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { ResourceImage } from "@/components/shared/resource-image";
import { ResourceAvailabilityBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/app-provider";
import {
  getAvailabilityPreview,
} from "@/services/booking.service";
import {
  formatDateRange,
  formatTimeRange,
} from "@/lib/utils";
import type { Booking } from "@/types/booking";
import {
  bookingRequestSchema,
  type BookingFormValues,
} from "../utils/booking-schema";
import { DateRangePicker } from "./date-range-picker";

function getDefaultDates() {
  const today = startOfDay(new Date());
  return {
    startDate: format(addDays(today, 1), "yyyy-MM-dd"),
    endDate: format(addDays(today, 1), "yyyy-MM-dd"),
  };
}

export function NewBookingForm({
  initialResourceId,
}: {
  initialResourceId?: string;
}) {
  const router = useRouter();
  const { resources, categories, bookings, currentUser, createBooking } =
    useApp();
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  const bookableResources = resources.filter(
    (resource) =>
      resource.status === "available" && resource.availableQuantity > 0,
  );
  const preselected =
    bookableResources.find((resource) => resource.id === initialResourceId) ??
    bookableResources[0];
  const defaultDates = getDefaultDates();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingRequestSchema),
    defaultValues: {
      resourceId: preselected?.id ?? "",
      purpose: "",
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
      startTime: "09:00",
      endTime: "17:00",
      quantity: 1,
      notes: "",
    },
  });

  const watchedValues = useWatch({ control });
  const values: BookingFormValues = {
    resourceId: watchedValues.resourceId ?? "",
    purpose: watchedValues.purpose ?? "",
    startDate: watchedValues.startDate ?? "",
    endDate: watchedValues.endDate ?? "",
    startTime: watchedValues.startTime ?? "",
    endTime: watchedValues.endTime ?? "",
    quantity: watchedValues.quantity ?? 1,
    notes: watchedValues.notes ?? "",
  };
  const selectedResource = resources.find(
    (resource) => resource.id === values.resourceId,
  );
  const selectedCategory = categories.find(
    (category) => category.id === selectedResource?.categoryId,
  );

  const startDate = isValid(parseISO(values.startDate))
    ? parseISO(values.startDate)
    : undefined;
  const endDate = isValid(parseISO(values.endDate))
    ? parseISO(values.endDate)
    : undefined;

  const preview = useMemo(() => {
    if (!selectedResource) return null;
    return getAvailabilityPreview(
      selectedResource,
      bookings,
      {
        startDate: values.startDate,
        endDate: values.endDate,
        startTime: values.startTime,
        endTime: values.endTime,
      },
      values.quantity || 0,
    );
  }, [
    selectedResource,
    bookings,
    values.startDate,
    values.endDate,
    values.startTime,
    values.endTime,
    values.quantity,
  ]);

  const onSubmit = (formValues: BookingFormValues) => {
    const resource = resources.find(
      (item) => item.id === formValues.resourceId,
    );
    if (!resource) {
      setError("resourceId", { message: "Choose a resource to book." });
      return;
    }

    const availability = getAvailabilityPreview(
      resource,
      bookings,
      formValues,
      formValues.quantity,
    );
    if (!availability.isEnough) {
      setError("quantity", {
        message: `Only ${availability.projectedAvailable} unit${availability.projectedAvailable === 1 ? "" : "s"} can be reserved for these dates.`,
      });
      toast.error("Not enough availability for that request.");
      return;
    }

    const result = createBooking({
      ...formValues,
      userId: currentUser.id,
      notes: formValues.notes,
    });

    if (!result.success || !result.booking) {
      toast.error(result.message);
      return;
    }

    setCreatedBooking(result.booking);
    toast.success(result.message);
  };

  const handleCreateAnother = () => {
    setCreatedBooking(null);
    reset({
      resourceId: selectedResource?.id ?? preselected?.id ?? "",
      purpose: "",
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
      startTime: "09:00",
      endTime: "17:00",
      quantity: 1,
      notes: "",
    });
  };

  if (bookableResources.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <Package className="mx-auto size-8 text-slate-300" />
        <h1 className="mt-3 text-lg font-semibold text-slate-900">
          No resources are available right now
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          All equipment is currently booked or under maintenance. Check the
          catalogue again later or contact the resource desk.
        </p>
        <Button asChild className="mt-5">
          <Link href="/resources">Back to catalogue</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/resources">
              <ArrowLeft className="size-4" />
              Back to catalogue
            </Link>
          </Button>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-indigo-600">
            Create booking
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">
            Request a resource
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            Choose your equipment and time window. We check the current holds
            before your request is sent to a resource manager.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]"
        >
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Booking details</CardTitle>
                <p className="text-sm text-slate-500">
                  All fields marked with an asterisk are required.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  label="Resource"
                  htmlFor="resourceId"
                  required
                  error={errors.resourceId?.message}
                  hint="Only resources with available units are shown."
                >
                  <Controller
                    control={control}
                    name="resourceId"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setValue("quantity", 1, { shouldValidate: true });
                        }}
                      >
                        <SelectTrigger
                          id="resourceId"
                          aria-invalid={Boolean(errors.resourceId)}
                        >
                          <SelectValue placeholder="Choose a resource" />
                        </SelectTrigger>
                        <SelectContent>
                          {bookableResources.map((resource) => {
                            const category = categories.find(
                              (item) => item.id === resource.categoryId,
                            );
                            return (
                              <SelectItem
                                key={resource.id}
                                value={resource.id}
                              >
                                {resource.name} · {category?.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>

                <FormField
                  label="Purpose"
                  htmlFor="purpose"
                  required
                  error={errors.purpose?.message}
                  hint="Explain what the equipment will be used for."
                >
                  <Textarea
                    id="purpose"
                    placeholder="For example: Filming a 10-minute documentary interview for the design studio archive."
                    aria-invalid={Boolean(errors.purpose)}
                    {...register("purpose")}
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Booking dates"
                    htmlFor="startDate"
                    required
                    error={errors.startDate?.message ?? errors.endDate?.message}
                  >
                    <DateRangePicker
                      value={
                        startDate
                          ? { from: startDate, to: endDate }
                          : undefined
                      }
                      onChange={(range) => {
                        if (!range?.from) {
                          setValue("startDate", "", { shouldValidate: true });
                          setValue("endDate", "", { shouldValidate: true });
                          return;
                        }
                        const nextStart = format(range.from, "yyyy-MM-dd");
                        const nextEnd = format(
                          range.to ?? range.from,
                          "yyyy-MM-dd",
                        );
                        setValue("startDate", nextStart, {
                          shouldValidate: true,
                        });
                        setValue("endDate", nextEnd, {
                          shouldValidate: true,
                        });
                      }}
                      invalid={Boolean(
                        errors.startDate || errors.endDate,
                      )}
                    />
                  </FormField>

                  <FormField
                    label="Quantity"
                    htmlFor="quantity"
                    required
                    error={errors.quantity?.message}
                    hint={
                      preview
                        ? `${preview.projectedAvailable} available for this window`
                        : undefined
                    }
                  >
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      max={Math.max(1, preview?.projectedAvailable ?? 1)}
                      aria-invalid={Boolean(errors.quantity)}
                      {...register("quantity", { valueAsNumber: true })}
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Start time"
                    htmlFor="startTime"
                    required
                    error={errors.startTime?.message}
                  >
                    <Input
                      id="startTime"
                      type="time"
                      aria-invalid={Boolean(errors.startTime)}
                      {...register("startTime")}
                    />
                  </FormField>
                  <FormField
                    label="End time"
                    htmlFor="endTime"
                    required
                    error={errors.endTime?.message}
                  >
                    <Input
                      id="endTime"
                      type="time"
                      aria-invalid={Boolean(errors.endTime)}
                      {...register("endTime")}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Additional notes"
                  htmlFor="notes"
                  error={errors.notes?.message}
                  hint="Optional. Add collection details or accessibility needs."
                >
                  <Textarea
                    id="notes"
                    placeholder="Anything the resource manager should know?"
                    aria-invalid={Boolean(errors.notes)}
                    {...register("notes")}
                  />
                </FormField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck2 className="size-4 text-indigo-600" />
                  Availability check
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedResource && preview ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Available now
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900 tabular">
                        {selectedResource.availableQuantity}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Pending holds
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900 tabular">
                        {preview.pendingReserved}
                      </p>
                    </div>
                    <div
                      className={`rounded-lg border p-3 ${
                        preview.isEnough
                          ? "border-emerald-200 bg-emerald-50/60"
                          : "border-amber-200 bg-amber-50/70"
                      }`}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        For your window
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-900 tabular">
                        {preview.projectedAvailable}
                      </p>
                    </div>
                    <p className="text-[11px] leading-5 text-slate-400 sm:col-span-3">
                      {preview.isEnough
                        ? "The requested quantity fits within current availability. Final approval is subject to a resource manager review."
                        : "The requested quantity exceeds the availability for this window. Try a shorter date range, fewer units, or another resource."}
                    </p>
                  </div>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <Info className="size-4 text-slate-400" />
                    Select a resource to see live availability.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle>Request summary</CardTitle>
                <p className="text-[12px] text-slate-500">
                  Review before sending your request.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedResource ? (
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                    <ResourceImage
                      src={selectedResource.image}
                      alt={selectedResource.name}
                      assetTag={selectedResource.assetTag}
                      className="size-14 shrink-0 rounded-lg"
                      sizes="56px"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-900">
                        {selectedResource.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {selectedCategory?.name}
                      </p>
                      <ResourceAvailabilityBadge
                        resource={selectedResource}
                        className="mt-1.5 scale-90 origin-left"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Your selected resource will appear here.
                  </p>
                )}

                <dl className="space-y-2.5 text-[12px]">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-400">Dates</dt>
                    <dd className="text-right font-medium text-slate-700">
                      {startDate && endDate
                        ? formatDateRange(values.startDate, values.endDate)
                        : "Not selected"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-400">Time</dt>
                    <dd className="text-right font-medium text-slate-700">
                      {formatTimeRange(values.startTime, values.endTime)}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-400">Quantity</dt>
                    <dd className="text-right font-medium text-slate-700 tabular">
                      {values.quantity || 1} unit
                      {values.quantity === 1 ? "" : "s"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-400">Collect from</dt>
                    <dd className="text-right font-medium text-slate-700">
                      {selectedResource?.location ?? "—"}
                    </dd>
                  </div>
                </dl>

                <div className="space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                  <p className="flex items-center gap-1.5">
                    <Clock3 className="size-3.5" />
                    Pending approval after submission
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    Collect with your university ID
                  </p>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Submit booking request
                  <ArrowRight className="size-4" />
                </Button>
                <p className="text-center text-[10px] leading-4 text-slate-400">
                  This demo stores your request in local browser storage. No
                  server request is sent.
                </p>
              </CardContent>
            </Card>
          </aside>
        </form>
      </div>

      <Dialog
        open={Boolean(createdBooking)}
        onOpenChange={(open) => {
          if (!open) setCreatedBooking(null);
        }}
      >
        <DialogContent className="max-w-md text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-7" />
          </div>
          <DialogHeader className="items-center pr-0">
            <DialogTitle>Booking request submitted</DialogTitle>
            <DialogDescription>
              Your request is pending review. A resource manager will approve
              or decline it shortly.
            </DialogDescription>
          </DialogHeader>
          {createdBooking ? (
            <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-indigo-500">
                Booking reference
              </p>
              <p className="mt-1 font-mono text-lg font-semibold text-indigo-800">
                {createdBooking.bookingReference}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {selectedResource?.name} ·{" "}
                {formatDateRange(
                  createdBooking.startDate,
                  createdBooking.endDate,
                )}
              </p>
            </div>
          ) : null}
          <DialogFooter className="sm:justify-center">
            <Button type="button" variant="outline" onClick={handleCreateAnother}>
              Create another
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (createdBooking) {
                  router.push(`/my-bookings/${createdBooking.id}`);
                }
              }}
            >
              View booking
              <ArrowRight className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
