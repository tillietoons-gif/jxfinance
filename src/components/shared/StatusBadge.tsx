"use client";

import { cn } from "@/lib/utils";

// JACXI-branded status badges — gold for premium/pending, semantic for others
const VEHICLE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-[#D4AF37]/15 text-[#92730E] border-[#D4AF37]/30",
  IN_YARD: "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]",
  LOADED: "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]",
  IN_TRANSIT: "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]",
  CUSTOMS: "bg-[#F59E0B]/10 text-[#92400E] border-[#F59E0B]/30",
  DELIVERED: "bg-[#D4AF37]/15 text-[#92730E] border-[#D4AF37]/30",
  CANCELLED: "bg-[#DC2626]/10 text-[#991B1B] border-[#DC2626]/30",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]",
  ISSUED: "bg-black/5 text-black border-black/15",
  PAID: "bg-[#D4AF37]/15 text-[#92730E] border-[#D4AF37]/30",
  PARTIALLY_PAID: "bg-[#F59E0B]/10 text-[#92400E] border-[#F59E0B]/30",
  OVERDUE: "bg-[#DC2626]/10 text-[#991B1B] border-[#DC2626]/30",
};

// Leading status dots — independent of text color so grey badges stay distinguishable
const VEHICLE_DOT_COLORS: Record<string, string> = {
  PENDING: "bg-[#D4AF37]",
  IN_YARD: "bg-[#9CA3AF]",
  LOADED: "bg-[#6B7280]",
  IN_TRANSIT: "bg-[#111827]",
  CUSTOMS: "bg-[#F59E0B]",
  DELIVERED: "bg-[#92730E]",
  CANCELLED: "bg-[#DC2626]",
};

const INVOICE_DOT_COLORS: Record<string, string> = {
  DRAFT: "bg-[#9CA3AF]",
  ISSUED: "bg-[#374151]",
  PAID: "bg-[#92730E]",
  PARTIALLY_PAID: "bg-[#F59E0B]",
  OVERDUE: "bg-[#DC2626]",
};

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
  const dot =
    type === "vehicle"
      ? VEHICLE_DOT_COLORS[status] || VEHICLE_DOT_COLORS.PENDING
      : INVOICE_DOT_COLORS[status] || INVOICE_DOT_COLORS.DRAFT;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-brand",
        colors
      )}
    >
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)}
      />
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function TypeBadge({
  type,
}: {
  type: string;
}) {
  // Customer ledger = gold accent, Company ledger = jet black
  const map: Record<string, string> = {
    CUSTOMER: "bg-[#D4AF37]/15 text-[#92730E] border-[#D4AF37]/30",
    COMPANY: "bg-black text-white border-black",
    DEBIT: "bg-[#DC2626]/10 text-[#991B1B] border-[#DC2626]/30",
    CREDIT: "bg-[#D4AF37]/15 text-[#92730E] border-[#D4AF37]/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-brand",
        map[type] || "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]"
      )}
    >
      {type}
    </span>
  );
}
