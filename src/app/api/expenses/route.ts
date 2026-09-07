import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expenseSchema, serverError, validationError, writeAuditLog } from "@/lib/api";

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
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = expenseSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    const body = parsed.data;
    const customerCharge = body.customerCharge;
    const companyCost = body.companyCost;
    const profit = customerCharge - companyCost;

    const expense = await db.expense.create({
      data: {
        vehicleId: body.vehicleId,
        title: body.title,
        category: body.category || null,
        vendorId: body.vendorId || null,
        receiptUrl: body.receiptUrl || null,
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

    await writeAuditLog({
      entity: "Expense",
      entityId: expense.id,
      customerId: expense.vehicle.customerId,
      action: "created",
      details: `${expense.title} created with customer charge ${customerCharge} and company cost ${companyCost}`,
    });

    return NextResponse.json(expense);
  } catch (e) {
    return serverError(e);
  }
}
