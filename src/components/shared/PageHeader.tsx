"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6",
        className
      )}
    >
      <div className="flex items-start gap-3.5">
        {Icon && (
          <div className="relative h-11 w-11 rounded-md bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
            <Icon className="h-4 w-4 text-[#D4AF37]" />
            <span className="absolute -bottom-1 left-2 right-2 h-0.5 bg-[#D4AF37]" />
          </div>
        )}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider-brand text-[#92730E]">
            JACXI workspace
          </p>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-black">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[#6B7280] mt-1 tracking-wide font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
