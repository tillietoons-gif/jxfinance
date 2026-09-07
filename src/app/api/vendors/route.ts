import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { serverError, validationError } from "@/lib/api";

const vendorSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function GET() {
  try {
    return NextResponse.json(
      await db.vendor.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { expenses: true } } } })
    );
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = vendorSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    return NextResponse.json(await db.vendor.create({ data: parsed.data }));
  } catch (error) {
    return serverError(error);
  }
}
