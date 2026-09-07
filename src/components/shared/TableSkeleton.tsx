"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Bar widths rotate per row so the skeleton reads like a real table
const BAR_WIDTHS: string[][] = [
  ["w-1/4", "w-2/5", "w-1/6"],
  ["w-1/3", "w-1/4", "w-1/5", "w-1/6"],
  ["w-2/5", "w-1/3", "w-1/4"],
  ["w-1/4", "w-1/2", "w-1/5", "w-1/6"],
  ["w-1/3", "w-1/6", "w-1/4", "w-1/5"],
  ["w-1/4", "w-1/3", "w-1/2"],
];

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="p-4 space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => {
        const widths = BAR_WIDTHS[i % BAR_WIDTHS.length];
        return (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md bg-[#F3F4F6]" />
            {widths.map((w, j) => (
              <Skeleton key={j} className={cn("h-4 bg-[#F3F4F6]", w)} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
