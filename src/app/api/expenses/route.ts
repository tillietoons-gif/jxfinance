import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId");
    const expenses = await db.expense.findMany({
      where: { ...(vehicleId ? { vehicleId } : {}) },
      orderBy: { createdAt: "desc" },
      include: { vehicle: { include: { customer: true } } },
    });
    return NextResponse.json(expenses);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customerCharge = Number(body.customerCharge || 0);
    const companyCost = Number(body.companyCost || 0);
    const profit = customerCharge - companyCost;

    const expense = await db.expense.create({
      data: {
        vehicleId: body.vehicleId,
        title: body.title,
        customerCharge,
        companyCost,
        profit,
        notes: body.notes || null,
      },
      include: { vehicle: { include: { customer: true } } },
    });

    // Add a debit entry to the customer's ledger (customer owes more)
    if (customerCharge > 0) {
      const customerLedger = await db.ledger.findFirst({
        where: { customerId: expense.vehicle.customerId, type: "CUSTOMER" },
      });
      if (customerLedger) {
        await db.$transaction([
          db.ledgerTransaction.create({
            data: {
              ledgerId: customerLedger.id,
              amount: customerCharge,
              type: "DEBIT",
              description: `Expense: ${expense.title} (Vehicle ${expense.vehicle.vin})`,
              referenceId: expense.id,
            },
          }),
          db.ledger.update({
            where: { id: customerLedger.id },
            data: { balance: customerLedger.balance + customerCharge },
          }),
        ]);
      }
    }

    // Add a credit entry to the company ledger (company spent)
    if (companyCost > 0) {
      let companyLedger = await db.ledger.findFirst({
        where: { type: "COMPANY" },
      });
      if (!companyLedger) {
        companyLedger = await db.ledger.create({
          data: {
            name: "Operating Account",
            type: "COMPANY",
            balance: 0,
          },
        });
      }
      await db.$transaction([
        db.ledgerTransaction.create({
          data: {
            ledgerId: companyLedger.id,
            amount: companyCost,
            type: "DEBIT",
            description: `Cost: ${expense.title} (Vehicle ${expense.vehicle.vin})`,
            referenceId: expense.id,
          },
        }),
        db.ledger.update({
          where: { id: companyLedger.id },
          data: { balance: companyLedger.balance + companyCost },
        }),
      ]);
    }

    return NextResponse.json(expense);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
