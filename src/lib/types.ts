// Shared type definitions and constants

export const VEHICLE_STATUSES = [
  "PENDING",
  "IN_YARD",
  "LOADED",
  "IN_TRANSIT",
  "CUSTOMS",
  "DELIVERED",
  "CANCELLED",
] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const LEDGER_TYPES = ["CUSTOMER", "COMPANY"] as const;
export type LedgerType = (typeof LEDGER_TYPES)[number];

export const TRANSACTION_TYPES = ["DEBIT", "CREDIT"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const INVOICE_STATUSES = [
  "DRAFT",
  "ISSUED",
  "PAID",
  "PARTIALLY_PAID",
  "OVERDUE",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export function calculateInvoiceStatus(
  status: string,
  dueDate: Date | string,
  total: number,
  paid: number
): InvoiceStatus {
  if (status === "DRAFT") return "DRAFT";
  if (total > 0 && paid >= total) return "PAID";
  if (paid > 0) return "PARTIALLY_PAID";
  if (new Date(dueDate).getTime() < Date.now()) return "OVERDUE";
  return "ISSUED";
}

export const PAYMENT_METHODS = [
  "Bank Transfer",
  "Cash",
  "Wire",
  "Check",
  "Card",
] as const;

export const VEHICLE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  IN_YARD: "bg-blue-100 text-blue-700 border-blue-200",
  LOADED: "bg-purple-100 text-purple-700 border-purple-200",
  IN_TRANSIT: "bg-cyan-100 text-cyan-700 border-cyan-200",
  CUSTOMS: "bg-orange-100 text-orange-700 border-orange-200",
  DELIVERED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  ISSUED: "bg-blue-100 text-blue-700 border-blue-200",
  PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700 border-amber-200",
  OVERDUE: "bg-rose-100 text-rose-700 border-rose-200",
};

export function formatCurrency(value: number | null | undefined): string {
  const v = Number(value ?? 0);
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNumber(value: number | null | undefined): string {
  const v = Number(value ?? 0);
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${y}${m}${d}-${rand}`;
}

export function dateRangeFilter(
  start?: string,
  end?: string
): { gte?: Date; lte?: Date } {
  const f: { gte?: Date; lte?: Date } = {};
  if (start) f.gte = new Date(start);
  if (end) {
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);
    f.lte = e;
  }
  return f;
}
