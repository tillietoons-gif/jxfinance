import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const vendorSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const vendor = await db.vendor.findUnique({ where: { id: (await params).id }, include: { expenses: { include: { vehicle: true }, orderBy: { createdAt: "desc" } } } });
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    return NextResponse.json(vendor);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load vendor" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsed = vendorSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid vendor data", issues: parsed.error.issues }, { status: 400 });
    return NextResponse.json(await db.vendor.update({ where: { id: (await params).id }, data: parsed.data }));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db.vendor.delete({ where: { id: (await params).id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 });
  }
}
