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

// JACXI brand variants — gilded minimalism
// default: pure white card with subtle grey border
// primary: jet black bg with gold accent (premium KPI)
// success/warning/danger: snow-white bg with tinted border + tinted label
const variants: Record<string, string> = {
  default: "bg-white text-black border-[#E5E7EB]",
  primary: "bg-black text-white border-black",
  success: "bg-white text-black border-[#D4AF37]/40",
  warning: "bg-white text-black border-[#F59E0B]/40",
  danger: "bg-white text-black border-[#DC2626]/40",
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
        "border overflow-hidden shadow-none transition-all rounded-md",
        variants[variant],
        variant === "default" && "hover:border-[#D4AF37]/50 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p
              className={cn(
                "text-[10px] font-semibold uppercase tracking-brand",
                variant === "primary" ? "text-[#D4AF37]" : "text-[#6B7280]"
              )}
            >
              {label}
            </p>
            <p className="text-2xl font-bold tracking-[-0.03em]">{value}</p>
            {hint && (
              <p
                className={cn(
                  "text-xs",
                  variant === "primary" ? "text-white/60" : "text-[#6B7280]"
                )}
              >
                {hint}
              </p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-xs font-semibold",
                  trend.positive
                    ? variant === "primary"
                      ? "text-[#D4AF37]"
                      : "text-[#92730E]"
                    : "text-[#DC2626]"
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
                  ? "bg-[#D4AF37]/15"
                  : "bg-[#F9FAFB]"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  variant === "primary" ? "text-[#D4AF37]" : "text-[#6B7280]"
                )}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
