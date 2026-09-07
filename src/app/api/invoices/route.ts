import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/types";

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
        _count: { select: { expenses: true } },
      },
    });
    return NextResponse.json(invoices);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
        status: body.status || "DRAFT",
        dueDate: new Date(body.dueDate),
        subtotal,
        tax,
        total,
        items: {
          create: items.map((it: any) => ({
            description: it.description,
            quantity: Number(it.quantity || 1),
            unitPrice: Number(it.unitPrice || 0),
            total: Number(it.total || it.unitPrice * it.quantity || 0),
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
    return NextResponse.json(invoice);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
