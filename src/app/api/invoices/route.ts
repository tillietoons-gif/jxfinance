import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateInvoiceStatus, generateInvoiceNumber } from "@/lib/types";
import { invoiceSchema, serverError, validationError, writeAuditLog } from "@/lib/api";

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
    const items = body.items || [];
    const subtotal = items.reduce(
      (s: number, it: any) => s + Number(it.total || it.unitPrice * it.quantity || 0),
      0
    );
    const tax = Number(body.tax || 0);
    const total = subtotal + tax;
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber: body.invoiceNumber || generateInvoiceNumber(),
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

    // Add invoice total as a DEBIT to the customer ledger
    if (invoice.status === "ISSUED" && invoice.total > 0) {
      const ledger = await db.ledger.findFirst({
        where: { customerId: invoice.customerId, type: "CUSTOMER" },
      });
      if (ledger) {
        await db.$transaction([
          db.ledgerTransaction.create({
            data: {
              ledgerId: ledger.id,
              amount: invoice.total,
              type: "DEBIT",
              description: `Invoice ${invoice.invoiceNumber}`,
              referenceId: invoice.id,
            },
          }),
          db.ledger.update({
            where: { id: ledger.id },
            data: { balance: ledger.balance + invoice.total },
          }),
        ]);
      }
    }
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
