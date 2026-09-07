"use client";

import { cn } from "@/lib/utils";
import { VEHICLE_STATUS_COLORS, INVOICE_STATUS_COLORS } from "@/lib/types";

export function StatusBadge({
  status,
  type = "vehicle",
}: {
  status: string;
  type?: "vehicle" | "invoice";
}) {
  const colors =
    type === "vehicle"
      ? VEHICLE_STATUS_COLORS[status] || VEHICLE_STATUS_COLORS.PENDING
      : INVOICE_STATUS_COLORS[status] || INVOICE_STATUS_COLORS.DRAFT;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
        colors
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function TypeBadge({
  type,
}: {
  type: string;
}) {
  const map: Record<string, string> = {
    CUSTOMER: "bg-violet-100 text-violet-700 border-violet-200",
    COMPANY: "bg-slate-100 text-slate-700 border-slate-200",
    DEBIT: "bg-rose-100 text-rose-700 border-rose-200",
    CREDIT: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium",
        map[type] || "bg-slate-100 text-slate-700 border-slate-200"
      )}
    >
      {type}
    </span>
  );
}
