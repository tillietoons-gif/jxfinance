import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const customers = await db.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { vehicles: true, invoices: true, payments: true },
        },
      },
    });
    return NextResponse.json(customers);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customer = await db.customer.create({
      data: {
        name: body.name,
        companyName: body.companyName || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
      },
    });
    await db.ledger.create({
      data: {
        name: `${customer.name} - Customer Ledger`,
        type: "CUSTOMER",
        customerId: customer.id,
        balance: 0,
      },
    });
    return NextResponse.json(customer);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
