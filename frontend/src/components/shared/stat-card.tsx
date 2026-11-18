import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const ACCENTS = {
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  rose: "bg-rose-50 text-rose-600 border-rose-100",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "indigo",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: keyof typeof ACCENTS;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg border",
            ACCENTS[accent],
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      {hint ? (
        <p className="mt-3 text-xs leading-5 text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
