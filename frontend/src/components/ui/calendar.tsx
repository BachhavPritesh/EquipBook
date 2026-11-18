"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { DayPicker, type DayPickerProps } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = DayPickerProps;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row",
        month: "relative space-y-4",
        month_caption:
          "relative flex h-9 items-center justify-center px-10",
        caption_label: "text-sm font-semibold text-slate-900",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between px-1",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "size-8 bg-white p-0 text-slate-600",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "size-8 bg-white p-0 text-slate-600",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 rounded-md text-[11px] font-medium uppercase tracking-wider text-slate-400",
        week: "mt-1.5 flex w-full",
        day: "relative size-9 p-0 text-center text-sm",
        day_button: cn(
          "size-9 rounded-lg p-0 font-normal text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-indigo-700",
        range_start: "rounded-l-lg bg-indigo-50",
        range_end: "rounded-r-lg bg-indigo-50",
        range_middle:
          "bg-indigo-50 [&>button]:rounded-none [&>button]:text-indigo-700 [&>button]:hover:bg-indigo-100",
        today: "[&>button]:font-semibold [&>button]:text-primary",
        outside: "[&>button]:text-slate-300",
        disabled: "[&>button]:text-slate-300 [&>button]:opacity-60",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation = "left", className: iconClassName }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : orientation === "up"
                  ? ChevronUp
                  : ChevronDown;
          return <Icon className={cn("size-4", iconClassName)} />;
        },
      }}
      {...props}
    />
  );
}
