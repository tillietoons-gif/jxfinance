import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
      include: { customer: true, vehicle: true },
    });
    return NextResponse.json(payments);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const payment = await db.payment.create({
      data: {
        customerId: body.customerId,
        vehicleId: body.vehicleId || null,
        amount,
        method: body.method,
        referenceNo: body.referenceNo || null,
        notes: body.notes || null,
      },
      include: { customer: true, vehicle: true },
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
          where: { customerId: payment.customerId },
          _sum: { amount: true },
        });
        // simplified - just mark as partially paid
        await db.invoice.update({
          where: { id: invoice.id },
          data: { status: "PARTIALLY_PAID" },
        });
      }
    }

    return NextResponse.json(payment);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
