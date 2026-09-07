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
          <div className="h-10 w-10 rounded-md bg-black text-white flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[#6B7280] mt-1 uppercase tracking-brand font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
