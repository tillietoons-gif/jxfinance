import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerSchema, serverError, validationError } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        vehicles: { orderBy: { createdAt: "desc" } },
        ledgers: {
          include: { transactions: { orderBy: { createdAt: "desc" } } },
        },
        invoices: { orderBy: { createdAt: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
        notes: { orderBy: { createdAt: "desc" } },
        auditLogs: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!customer)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const invoiced = customer.invoices
      .filter((invoice) => invoice.status !== "DRAFT")
      .reduce((sum, invoice) => sum + invoice.total, 0);
    const paid = customer.payments.reduce((sum, payment) => sum + payment.amount, 0);
    return NextResponse.json({ ...customer, balance: invoiced - paid, invoiced, paid });
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const parsed = customerSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    const body = parsed.data;
    const updated = await db.customer.update({
      where: { id },
      data: {
        name: body.name,
        companyName: body.companyName || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.customer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
