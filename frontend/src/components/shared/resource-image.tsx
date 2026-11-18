"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";

import { cn } from "@/lib/utils";

export function ResourceImage({
  src,
  alt,
  assetTag,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
}: {
  src?: string;
  alt: string;
  assetTag?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center overflow-hidden bg-slate-100 bg-dot-grid text-slate-400",
          className,
        )}
        role="img"
        aria-label={assetTag ? `${alt} (${assetTag})` : alt}
      >
        <Package className="size-6" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-slate-100", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => setFailed(true)}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
    </div>
  );
}
