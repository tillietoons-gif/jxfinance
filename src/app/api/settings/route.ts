import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { serverError, validationError } from "@/lib/api";

const settingsSchema = z.object({
  companyName: z.string().trim().min(1).max(160),
  companyEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
  companyPhone: z.string().trim().max(40).optional().or(z.literal("")),
  companyAddress: z.string().trim().max(500).optional().or(z.literal("")),
  logoUrl: z.string().url().max(2000).optional().or(z.literal("")),
  currency: z.string().trim().length(3),
  taxRate: z.coerce.number().finite().min(0).max(100),
  invoicePrefix: z.string().trim().min(1).max(20),
  defaultVehicleStatus: z.string().trim().min(1).max(40),
  defaultPaymentMethod: z.string().trim().min(1).max(60),
});

export async function GET() {
  try {
    const settings = await db.appSettings.upsert({
      where: { id: "default" },
      create: {},
      update: {},
    });
    return NextResponse.json(settings);
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const parsed = settingsSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    const settings = await db.appSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...parsed.data },
      update: parsed.data,
    });
    return NextResponse.json(settings);
  } catch (error) {
    return serverError(error);
  }
}
