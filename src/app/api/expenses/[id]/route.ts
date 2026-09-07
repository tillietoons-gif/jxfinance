import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { expenseSchema, writeAuditLog } from "@/lib/api";
import { calculateInvoiceLedgerDebit, reconcileInvoiceLedger } from "@/lib/invoice-accounting";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const parsed = expenseSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid expense data", issues: parsed.error.issues }, { status: 400 });
    const body = parsed.data;
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
              data: { balance: companyLedger.balance + existing.companyCost },
            }),
          ]);
        }
      }
    }

    const updated = await db.expense.update({
      where: { id },
      data: {
        title: body.title,
        category: body.category || null,
        vendorId: body.vendorId || null,
        receiptUrl: body.receiptUrl || null,
        customerCharge,
        companyCost,
        profit,
        notes: body.notes || null,
      },
      include: { vehicle: { include: { customer: true } }, vendor: true },
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
              type: "CREDIT",
              description: `Cost: ${updated.title} (Vehicle ${updated.vehicle.vin})`,
              referenceId: updated.id,
            },
          }),
          db.ledger.update({
            where: { id: companyLedger.id },
            data: { balance: companyLedger.balance - companyCost },
          }),
        ]);
      }
    }

    if (updated.invoiceId) {
      await db.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({
          where: { id: updated.invoiceId as string },
          include: { items: true, expenses: true },
        });
        if (!invoice) return;
        const itemSubtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
        const expenseSubtotal = invoice.expenses.reduce(
          (sum, expense) => sum + expense.customerCharge,
          0
        );
        const total = itemSubtotal + expenseSubtotal + invoice.tax;
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { subtotal: itemSubtotal + expenseSubtotal, total },
        });
        await reconcileInvoiceLedger(
          tx,
          invoice.id,
          invoice.customerId,
          invoice.customerId,
          calculateInvoiceLedgerDebit(invoice.status, total, expenseSubtotal)
        );
      });
    }

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = z.object({ invoiceId: z.string().min(1).nullable() }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid billing assignment" }, { status: 400 });
    }
    const existing = await db.expense.findUnique({ where: { id }, include: { vehicle: true } });
    if (!existing) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    if (parsed.data.invoiceId) {
      const invoice = await db.invoice.findUnique({ where: { id: parsed.data.invoiceId } });
      if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      if (invoice.customerId !== existing.vehicle.customerId) {
        return NextResponse.json({ error: "Expense and invoice belong to different customers" }, { status: 400 });
      }
    }
    const updated = await db.expense.update({
      where: { id },
      data: { invoiceId: parsed.data.invoiceId },
      include: { invoice: true },
    });
    await writeAuditLog({
      entity: "Expense",
      entityId: id,
      customerId: existing.vehicle.customerId,
      action: parsed.data.invoiceId ? "billed" : "disputed",
      details: parsed.data.invoiceId
        ? `Assigned to invoice ${parsed.data.invoiceId}`
        : "Removed from invoice billing",
    });
    const affectedInvoiceIds = [existing.invoiceId, parsed.data.invoiceId].filter(
      (invoiceId): invoiceId is string => Boolean(invoiceId)
    );
    for (const invoiceId of [...new Set(affectedInvoiceIds)]) {
      const invoice = await db.invoice.findUnique({
        where: { id: invoiceId },
        include: { items: true, expenses: true },
      });
      if (!invoice) continue;
      const itemSubtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
      const expenseSubtotal = invoice.expenses.reduce(
        (sum, expense) => sum + expense.customerCharge,
        0
      );
      const total = itemSubtotal + expenseSubtotal + invoice.tax;
      await db.$transaction(async (tx) => {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { subtotal: itemSubtotal + expenseSubtotal, total },
        });
        await reconcileInvoiceLedger(
          tx,
          invoice.id,
          invoice.customerId,
          invoice.customerId,
          calculateInvoiceLedgerDebit(invoice.status, total, expenseSubtotal)
        );
      });
    }
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update billing assignment" }, { status: 500 });
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
              data: { balance: companyLedger.balance + existing.companyCost },
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
