import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Receivables = positive customer ledger balances
    // Payables = negative customer ledger balances (credit balances)
    const ledgers = await db.ledger.findMany({
      where: { type: "CUSTOMER" },
      include: { customer: true },
    });

    const now = new Date();
    const buckets = {
      current: 0,
      "1-30": 0,
      "31-60": 0,
      "61-90": 0,
      "90+": 0,
    };

    const rows = ledgers
      .filter((l) => l.balance !== 0)
      .map((l) => {
        const days = Math.floor(
          (now.getTime() - new Date(l.updatedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return {
          id: l.id,
          ledgerName: l.name,
          customerName: l.customer?.name || "",
          balance: l.balance,
          isReceivable: l.balance > 0,
          daysOutstanding: days,
          lastUpdated: l.updatedAt,
        };
      })
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

    rows.forEach((r) => {
      const abs = Math.abs(r.balance);
      if (r.daysOutstanding <= 0) buckets.current += abs;
      else if (r.daysOutstanding <= 30) buckets["1-30"] += abs;
      else if (r.daysOutstanding <= 60) buckets["31-60"] += abs;
      else if (r.daysOutstanding <= 90) buckets["61-90"] += abs;
      else buckets["90+"] += abs;
    });

    const totalReceivable = rows
      .filter((r) => r.isReceivable)
      .reduce((s, r) => s + r.balance, 0);
    const totalPayable = rows
      .filter((r) => !r.isReceivable)
      .reduce((s, r) => s + Math.abs(r.balance), 0);

    return NextResponse.json({
      rows,
      buckets,
      totalReceivable,
      totalPayable,
      count: rows.length,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
