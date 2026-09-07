import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  const { id, txId } = await params;
  try {
    const body = await req.json();
    const newAmount = Number(body.amount);
    const newType = body.type as "DEBIT" | "CREDIT";
    const description = body.description;

    const old = await db.ledgerTransaction.findUnique({
      where: { id: txId },
    });
    if (!old || old.ledgerId !== id)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const ledger = await db.ledger.findUnique({ where: { id } });
    if (!ledger)
      return NextResponse.json({ error: "Ledger not found" }, { status: 404 });

    // reverse old, apply new
    const reversed =
      old.type === "DEBIT"
        ? ledger.balance - old.amount
        : ledger.balance + old.amount;
    const newBalance =
      newType === "DEBIT" ? reversed + newAmount : reversed - newAmount;

    const [updated] = await db.$transaction([
      db.ledgerTransaction.update({
        where: { id: txId },
        data: { amount: newAmount, type: newType, description },
      }),
      db.ledger.update({ where: { id }, data: { balance: newBalance } }),
    ]);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; txId: string }> }
) {
  const { id, txId } = await params;
  try {
    const tx = await db.ledgerTransaction.findUnique({
      where: { id: txId },
    });
    if (!tx || tx.ledgerId !== id)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const ledger = await db.ledger.findUnique({ where: { id } });
    if (!ledger)
      return NextResponse.json({ error: "Ledger not found" }, { status: 404 });

    const newBalance =
      tx.type === "DEBIT"
        ? ledger.balance - tx.amount
        : ledger.balance + tx.amount;

    await db.$transaction([
      db.ledgerTransaction.delete({ where: { id: txId } }),
      db.ledger.update({ where: { id }, data: { balance: newBalance } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
