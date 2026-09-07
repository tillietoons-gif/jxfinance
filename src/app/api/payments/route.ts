import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateInvoiceStatus } from "@/lib/types";
import { paymentSchema, serverError, validationError, writeAuditLog } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const vehicleId = searchParams.get("vehicleId");
    const payments = await db.payment.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(vehicleId ? { vehicleId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { customer: true, vehicle: true, invoice: true },
    });
    return NextResponse.json(payments);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = paymentSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    const body = parsed.data;
    const amount = body.amount;
    const payment = await db.payment.create({
      data: {
        customerId: body.customerId,
        vehicleId: body.vehicleId || null,
        invoiceId: body.invoiceId || null,
        amount,
        method: body.method,
        referenceNo: body.referenceNo || null,
        notes: body.notes || null,
      },
      include: { customer: true, vehicle: true, invoice: true },
    });

    // Credit the customer ledger (reduce what they owe)
    const customerLedger = await db.ledger.findFirst({
      where: { customerId: payment.customerId, type: "CUSTOMER" },
    });
    if (customerLedger) {
      await db.$transaction([
        db.ledgerTransaction.create({
          data: {
            ledgerId: customerLedger.id,
            amount,
            type: "CREDIT",
            description: `Payment received: ${payment.method}${
              payment.vehicle ? ` (Vehicle ${payment.vehicle.vin})` : ""
            }`,
            referenceId: payment.id,
          },
        }),
        db.ledger.update({
          where: { id: customerLedger.id },
          data: { balance: customerLedger.balance - amount },
        }),
      ]);
    }

    // If linked to invoice(s) - mark paid if subtotal matched
    if (body.invoiceId) {
      const invoice = await db.invoice.findUnique({
        where: { id: body.invoiceId },
      });
      if (invoice) {
        const totalPaid = await db.payment.aggregate({
          where: { invoiceId: invoice.id },
          _sum: { amount: true },
        });
        const paid = totalPaid._sum.amount || 0;
        await db.invoice.update({
          where: { id: invoice.id },
          data: { status: calculateInvoiceStatus(invoice.status, invoice.dueDate, invoice.total, paid) },
        });
      }
    }

    await writeAuditLog({
      entity: "Payment",
      entityId: payment.id,
      customerId: payment.customerId,
      action: "created",
      details: `${payment.amount} received via ${payment.method}`,
    });

    return NextResponse.json(payment);
  } catch (e) {
    return serverError(e);
  }
}
