"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive?: boolean };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const variants: Record<string, string> = {
  default: "bg-white text-slate-900",
  primary: "bg-slate-900 text-white",
  success: "bg-emerald-50 text-emerald-900 border-emerald-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  danger: "bg-rose-50 text-rose-900 border-rose-200",
};

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: Props) {
  return (
    <Card
      className={cn(
        "border overflow-hidden shadow-none",
        variants[variant],
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium opacity-75 uppercase tracking-wide">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {hint && <p className="text-xs opacity-70">{hint}</p>}
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend.positive
                    ? "text-emerald-600"
                    : "text-rose-600"
                )}
              >
                {trend.value}
              </p>
            )}
          </div>
          {Icon && (
            <div
              className={cn(
                "h-8 w-8 rounded-md flex items-center justify-center",
                variant === "primary"
                  ? "bg-white/10"
                  : "bg-black/5"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
