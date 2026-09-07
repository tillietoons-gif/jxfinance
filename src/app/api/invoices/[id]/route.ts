import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateInvoiceStatus } from "@/lib/types";
import { invoiceSchema, serverError, validationError } from "@/lib/api";
import { calculateInvoiceLedgerDebit, reconcileInvoiceLedger } from "@/lib/invoice-accounting";

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
      include: { items: true, expenses: true },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const items = body.items || [];
    const itemSubtotal = items.reduce(
      (s: number, it: any) => s + Number(it.total || it.unitPrice * it.quantity || 0),
      0
    );
    const expenseIds = [...new Set(body.expenseIds ?? (
      existing.customerId === body.customerId
        ? existing.expenses.map((expense) => expense.id)
        : []
    ))];
    const vehicleIds = [...new Set(body.vehicleIds || (body.vehicleId ? [body.vehicleId] : []))];
    const attachedExpenses = expenseIds.length
      ? await db.expense.findMany({
          where: {
            id: { in: expenseIds },
            OR: [{ invoiceId: null }, { invoiceId: id }],
            vehicle: { customerId: body.customerId, ...(vehicleIds.length ? { id: { in: vehicleIds } } : {}) },
          },
          select: { customerCharge: true },
        })
      : [];
    if (attachedExpenses.length !== expenseIds.length) {
      return NextResponse.json(
        { error: "One or more selected expenses are unavailable or belong to another invoice" },
        { status: 409 }
      );
    }
    const expenseSubtotal = attachedExpenses.reduce((sum, expense) => sum + expense.customerCharge, 0);
    const subtotal = itemSubtotal + expenseSubtotal;
    const tax = Number(body.tax || 0);
    const total = subtotal + tax;

    const updated = await db.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

      const changed = await tx.invoice.update({
        where: { id },
        data: {
          customerId: body.customerId,
          vehicleId: body.vehicleId || null,
          status: body.status,
          ...(body.issueDate ? { issueDate: body.issueDate } : {}),
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
      await tx.expense.updateMany({ where: { invoiceId: id }, data: { invoiceId: null } });
      if (expenseIds.length > 0) {
        const attached = await tx.expense.updateMany({
          where: { id: { in: expenseIds }, invoiceId: null, vehicle: { customerId: changed.customerId } },
          data: { invoiceId: id },
        });
        if (attached.count !== expenseIds.length) {
          throw new Error("Selected expenses changed before invoice update completed");
        }
      }
      await reconcileInvoiceLedger(
        tx,
        id,
        existing.customerId,
        changed.customerId,
        calculateInvoiceLedgerDebit(changed.status, changed.total, expenseSubtotal)
      );
      return changed;
    });
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
