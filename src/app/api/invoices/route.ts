import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateInvoiceStatus, generateInvoiceNumber } from "@/lib/types";
import { invoiceSchema, serverError, validationError, writeAuditLog } from "@/lib/api";
import { calculateInvoiceLedgerDebit, reconcileInvoiceLedger } from "@/lib/invoice-accounting";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const invoices = await db.invoice.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        vehicle: true,
        items: true,
        expenses: true,
        payments: true,
        _count: { select: { expenses: true } },
      },
    });
    const withStatus = invoices.map((invoice) => {
      const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
      return { ...invoice, status: calculateInvoiceStatus(invoice.status, invoice.dueDate, invoice.total, paid), paid };
    });
    return NextResponse.json(withStatus);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = invoiceSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    const body = parsed.data;
    const settings = await db.appSettings.findUnique({ where: { id: "default" } });
    const items = body.items || [];
    const itemSubtotal = items.reduce(
      (s: number, it: any) => s + Number(it.total || it.unitPrice * it.quantity || 0),
      0
    );
    const expenseIds = [...new Set(body.expenseIds || [])];
    const vehicleIds = [...new Set(body.vehicleIds || (body.vehicleId ? [body.vehicleId] : []))];
    const attachedExpenses = expenseIds.length
      ? await db.expense.findMany({
          where: {
            id: { in: expenseIds },
            invoiceId: null,
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
    const invoice = await db.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber: body.invoiceNumber || generateInvoiceNumber(settings?.invoicePrefix || "INV"),
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
      if (expenseIds.length > 0) {
        const attached = await tx.expense.updateMany({
          where: { id: { in: expenseIds }, invoiceId: null, vehicle: { customerId: created.customerId } },
          data: { invoiceId: created.id },
        });
        if (attached.count !== expenseIds.length) {
          throw new Error("Selected expenses changed before invoice creation completed");
        }
      }
      await reconcileInvoiceLedger(
        tx,
        created.id,
        null,
        created.customerId,
        calculateInvoiceLedgerDebit(created.status, created.total, expenseSubtotal)
      );
      return created;
    });
    await writeAuditLog({
      entity: "Invoice",
      entityId: invoice.id,
      customerId: invoice.customerId,
      action: "created",
      details: `${invoice.invoiceNumber} created for ${invoice.total}`,
    });
    return NextResponse.json(invoice);
  } catch (e) {
    return serverError(e);
  }
}
