import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Add transaction to ledger & update balance
// DEBIT increases balance (customer owes more), CREDIT decreases balance (payment received)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const type = body.type as "DEBIT" | "CREDIT";
    const description = body.description as string;
    const referenceId = body.referenceId || null;

    const ledger = await db.ledger.findUnique({ where: { id } });
    if (!ledger)
      return NextResponse.json({ error: "Ledger not found" }, { status: 404 });

    const newBalance =
      type === "DEBIT" ? ledger.balance + amount : ledger.balance - amount;

    const [tx] = await db.$transaction([
      db.ledgerTransaction.create({
        data: {
          ledgerId: id,
          amount,
          type,
          description,
          referenceId,
        },
      }),
      db.ledger.update({
        where: { id },
        data: { balance: newBalance },
      }),
    ]);
    return NextResponse.json(tx);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const transactions = await db.ledgerTransaction.findMany({
      where: { ledgerId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(transactions);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
