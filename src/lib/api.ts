import { NextResponse } from "next/server";
import { z } from "zod";

export function validationError(error: z.ZodError) {
  return NextResponse.json(
    { error: "Validation failed", issues: error.issues },
    { status: 400 }
  );
}

export function serverError(error: unknown) {
  console.error(error);
  return NextResponse.json(
    { error: "An unexpected server error occurred" },
    { status: 500 }
  );
}

export async function writeAuditLog(data: {
  entity: string;
  entityId: string;
  action: string;
  details?: string;
  customerId?: string;
}) {
  const { db } = await import("@/lib/db");
  await db.auditLog.create({ data });
}

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required").max(160),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email address").max(254).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
});

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1).max(500),
  quantity: z.coerce.number().int().positive().max(100000),
  unitPrice: z.coerce.number().finite().nonnegative(),
  total: z.coerce.number().finite().nonnegative().optional(),
});

export const invoiceSchema = z.object({
  invoiceNumber: z.string().trim().max(80).optional().or(z.literal("")),
  customerId: z.string().min(1),
  vehicleId: z.string().min(1).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE"]).default("DRAFT"),
  dueDate: z.coerce.date(),
  tax: z.coerce.number().finite().nonnegative().default(0),
  items: z.array(invoiceItemSchema).max(200).default([]),
  expenseIds: z.array(z.string().min(1)).max(500).default([]),
});

export const paymentSchema = z.object({
  customerId: z.string().min(1),
  vehicleId: z.string().min(1).optional().or(z.literal("")),
  invoiceId: z.string().min(1).optional().or(z.literal("")),
  amount: z.coerce.number().finite().positive(),
  method: z.string().trim().min(1).max(60),
  referenceNo: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const expenseSchema = z.object({
  vehicleId: z.string().min(1),
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  vendorId: z.string().min(1).optional().or(z.literal("")),
  receiptUrl: z.string().url().max(2000).optional().or(z.literal("")),
  customerCharge: z.coerce.number().finite().nonnegative().default(0),
  companyCost: z.coerce.number().finite().nonnegative().default(0),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});
