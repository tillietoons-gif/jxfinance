import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const payment = await db.payment.findUnique({
      where: { id },
      include: { customer: true, vehicle: true },
    });
    if (!payment)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Reverse customer ledger credit
    const customerLedger = await db.ledger.findFirst({
      where: { customerId: payment.customerId, type: "CUSTOMER" },
    });
    if (customerLedger) {
      const tx = await db.ledgerTransaction.findFirst({
        where: { referenceId: payment.id, ledgerId: customerLedger.id },
      });
      if (tx) {
        await db.$transaction([
          db.ledgerTransaction.delete({ where: { id: tx.id } }),
          db.ledger.update({
            where: { id: customerLedger.id },
            data: { balance: customerLedger.balance + payment.amount },
          }),
        ]);
      }
    }

    await db.payment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
