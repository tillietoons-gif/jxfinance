import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const existing = await db.expense.findUnique({
      where: { id },
      include: { vehicle: true },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const customerCharge = Number(body.customerCharge || 0);
    const companyCost = Number(body.companyCost || 0);
    const profit = customerCharge - companyCost;

    // Reverse old entries on ledgers
    if (existing.customerCharge > 0) {
      const ledger = await db.ledger.findFirst({
        where: { customerId: existing.vehicle.customerId, type: "CUSTOMER" },
      });
      if (ledger) {
        const tx = await db.ledgerTransaction.findFirst({
          where: { referenceId: existing.id, ledgerId: ledger.id },
        });
        if (tx) {
          await db.$transaction([
            db.ledgerTransaction.delete({ where: { id: tx.id } }),
            db.ledger.update({
              where: { id: ledger.id },
              data: { balance: ledger.balance - existing.customerCharge },
            }),
          ]);
        }
      }
    }
    if (existing.companyCost > 0) {
      const companyLedger = await db.ledger.findFirst({
        where: { type: "COMPANY" },
      });
      if (companyLedger) {
        const tx = await db.ledgerTransaction.findFirst({
          where: { referenceId: existing.id, ledgerId: companyLedger.id },
        });
        if (tx) {
          await db.$transaction([
            db.ledgerTransaction.delete({ where: { id: tx.id } }),
            db.ledger.update({
              where: { id: companyLedger.id },
              data: { balance: companyLedger.balance - existing.companyCost },
            }),
          ]);
        }
      }
    }

    const updated = await db.expense.update({
      where: { id },
      data: {
        title: body.title,
        customerCharge,
        companyCost,
        profit,
        notes: body.notes || null,
      },
      include: { vehicle: { include: { customer: true } } },
    });

    // Re-add new entries
    if (customerCharge > 0) {
      const ledger = await db.ledger.findFirst({
        where: { customerId: updated.vehicle.customerId, type: "CUSTOMER" },
      });
      if (ledger) {
        await db.$transaction([
          db.ledgerTransaction.create({
            data: {
              ledgerId: ledger.id,
              amount: customerCharge,
              type: "DEBIT",
              description: `Expense: ${updated.title} (Vehicle ${updated.vehicle.vin})`,
              referenceId: updated.id,
            },
          }),
          db.ledger.update({
            where: { id: ledger.id },
            data: { balance: ledger.balance + customerCharge },
          }),
        ]);
      }
    }
    if (companyCost > 0) {
      const companyLedger = await db.ledger.findFirst({
        where: { type: "COMPANY" },
      });
      if (companyLedger) {
        await db.$transaction([
          db.ledgerTransaction.create({
            data: {
              ledgerId: companyLedger.id,
              amount: companyCost,
              type: "DEBIT",
              description: `Cost: ${updated.title} (Vehicle ${updated.vehicle.vin})`,
              referenceId: updated.id,
            },
          }),
          db.ledger.update({
            where: { id: companyLedger.id },
            data: { balance: companyLedger.balance + companyCost },
          }),
        ]);
      }
    }

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
    const existing = await db.expense.findUnique({
      where: { id },
      include: { vehicle: true },
    });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Reverse ledger entries
    if (existing.customerCharge > 0) {
      const ledger = await db.ledger.findFirst({
        where: { customerId: existing.vehicle.customerId, type: "CUSTOMER" },
      });
      if (ledger) {
        const tx = await db.ledgerTransaction.findFirst({
          where: { referenceId: existing.id, ledgerId: ledger.id },
        });
        if (tx) {
          await db.$transaction([
            db.ledgerTransaction.delete({ where: { id: tx.id } }),
            db.ledger.update({
              where: { id: ledger.id },
              data: { balance: ledger.balance - existing.customerCharge },
            }),
          ]);
        }
      }
    }
    if (existing.companyCost > 0) {
      const companyLedger = await db.ledger.findFirst({
        where: { type: "COMPANY" },
      });
      if (companyLedger) {
        const tx = await db.ledgerTransaction.findFirst({
          where: { referenceId: existing.id, ledgerId: companyLedger.id },
        });
        if (tx) {
          await db.$transaction([
            db.ledgerTransaction.delete({ where: { id: tx.id } }),
            db.ledger.update({
              where: { id: companyLedger.id },
              data: { balance: companyLedger.balance - existing.companyCost },
            }),
          ]);
        }
      }
    }

    await db.expense.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
