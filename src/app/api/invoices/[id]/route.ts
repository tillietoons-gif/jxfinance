import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateInvoiceStatus } from "@/lib/types";
import { invoiceSchema, serverError, validationError } from "@/lib/api";

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
        payments: true,
      },
    });
    if (!invoice)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    return NextResponse.json({
      ...invoice,
      paid,
      status: calculateInvoiceStatus(invoice.status, invoice.dueDate, invoice.total, paid),
    });
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
    const parsed = invoiceSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    const body = parsed.data;
    const existing = await db.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const items = body.items || [];
    const itemSubtotal = items.reduce(
      (s: number, it: any) => s + Number(it.total || it.unitPrice * it.quantity || 0),
      0
    );
    const attachedExpenses = body.expenseIds.length
      ? await db.expense.findMany({
          where: {
            id: { in: body.expenseIds },
            OR: [{ invoiceId: null }, { invoiceId: id }],
            vehicle: { customerId: body.customerId },
          },
          select: { customerCharge: true },
        })
      : [];
    const expenseSubtotal = attachedExpenses.reduce((sum, expense) => sum + expense.customerCharge, 0);
    const subtotal = itemSubtotal + expenseSubtotal;
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
        dueDate: body.dueDate,
        subtotal,
        tax,
        total,
        items: {
          create: items.map((it: any) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.total ?? it.unitPrice * it.quantity,
          })),
        },
      },
      include: { items: true, customer: true, vehicle: true },
    });
    await db.expense.updateMany({ where: { invoiceId: id }, data: { invoiceId: null } });
    if (body.expenseIds.length > 0) {
      await db.expense.updateMany({
        where: {
          id: { in: body.expenseIds },
          OR: [{ invoiceId: null }, { invoiceId: id }],
          vehicle: { customerId: updated.customerId },
        },
        data: { invoiceId: id },
      });
    }
    return NextResponse.json(updated);
  } catch (e) {
    return serverError(e);
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
    return serverError(e);
  }
}
