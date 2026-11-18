import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16">
      <BrandMark />
      <div className="mt-12 flex max-w-md flex-col items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
          <Compass className="size-5" />
        </div>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-indigo-600">
          404 · Off the shelf
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          This page is not in the catalogue
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          The page you are looking for may have moved, or the link is no longer
          valid. Head back to your workspace to keep browsing.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">
            <ArrowLeft className="size-4" />
            Back to overview
          </Link>
        </Button>
      </div>
    </main>
  );
}
