import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const customerId = searchParams.get("customerId");
    const ledgers = await db.ledger.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(customerId ? { customerId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        transactions: { orderBy: { createdAt: "desc" }, take: 50 },
        _count: { select: { transactions: true } },
      },
    });
    return NextResponse.json(ledgers);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ledger = await db.ledger.create({
      data: {
        name: body.name,
        type: body.type,
        customerId: body.customerId || null,
        balance: 0,
      },
    });
    return NextResponse.json(ledger);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
