import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandMark({
  href = "/dashboard",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-indigo-600 text-white shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-5"
          aria-hidden="true"
        >
          <path
            d="M4.5 8.2 12 4l7.5 4.2v7.6L12 20l-7.5-4.2V8.2Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="m4.8 8.3 7.2 4 7.2-4M12 12.3V19.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="m8.6 6.1 7.2 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute -right-1 -top-1 size-3 rounded-full bg-indigo-400/50 blur-[2px]" />
      </span>
      {compact ? null : (
        <span className="flex min-w-0 flex-col">
          <span className="text-[15px] font-semibold leading-none tracking-tight text-slate-900">
            EquipBook
          </span>
          <span className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
            Northbridge University
          </span>
        </span>
      )}
    </Link>
  );
}
