import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: { include: { expenses: true } },
        items: true,
        expenses: true,
      },
    });
    if (!invoice)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const existing = await db.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const items = body.items || [];
    const subtotal = items.reduce(
      (s: number, it: any) => s + Number(it.total || it.unitPrice * it.quantity || 0),
      0
    );
    const tax = Number(body.tax || 0);
    const total = subtotal + tax;

    // Delete old items, recreate new
    await db.invoiceItem.deleteMany({ where: { invoiceId: id } });

    const updated = await db.invoice.update({
      where: { id },
      data: {
        customerId: body.customerId,
        vehicleId: body.vehicleId || null,
        status: body.status,
        dueDate: new Date(body.dueDate),
        subtotal,
        tax,
        total,
        items: {
          create: items.map((it: any) => ({
            description: it.description,
            quantity: Number(it.quantity || 1),
            unitPrice: Number(it.unitPrice || 0),
            total: Number(it.total || it.unitPrice * it.quantity || 0),
          })),
        },
      },
      include: { items: true, customer: true, vehicle: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.invoice.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
