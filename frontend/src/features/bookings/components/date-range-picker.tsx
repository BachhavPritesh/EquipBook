"use client";

import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DateRangePicker({
  value,
  onChange,
  disabled,
  invalid,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const hasRange = Boolean(value?.from);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid}
          className={cn(
            "h-10 w-full justify-start gap-2 text-left font-normal",
            !hasRange && "text-slate-400",
            invalid && "border-rose-300",
          )}
        >
          <CalendarDays className="size-4 text-slate-400" />
          {value?.from ? (
            value.to ? (
              `${format(value.from, "MMM d, yyyy")} – ${format(value.to, "MMM d, yyyy")}`
            ) : (
              format(value.from, "MMM d, yyyy")
            )
          ) : (
            "Choose booking dates"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={1}
          disabled={{ before: new Date() }}
          defaultMonth={value?.from}
        />
      </PopoverContent>
    </Popover>
  );
}
