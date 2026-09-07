import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        where.createdAt.lte = e;
      }
    }

    const [expenses, payments] = await Promise.all([
      db.expense.findMany({
        where,
        include: { vehicle: { include: { customer: true } } },
      }),
      db.payment.findMany({ where }),
    ]);

    const totalRevenue = expenses.reduce(
      (s, e) => s + (e.customerCharge || 0),
      0
    );
    const totalCost = expenses.reduce((s, e) => s + (e.companyCost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const totalPayments = payments.reduce((s, p) => s + (p.amount || 0), 0);

    // Group by day
    const byDay: Record<string, { revenue: number; cost: number; profit: number }> =
      {};
    expenses.forEach((e) => {
      const d = new Date(e.createdAt).toISOString().slice(0, 10);
      if (!byDay[d]) byDay[d] = { revenue: 0, cost: 0, profit: 0 };
      byDay[d].revenue += e.customerCharge || 0;
      byDay[d].cost += e.companyCost || 0;
      byDay[d].profit += (e.customerCharge || 0) - (e.companyCost || 0);
    });

    return NextResponse.json({
      totalRevenue,
      totalCost,
      totalProfit,
      totalPayments,
      margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      expenseCount: expenses.length,
      paymentCount: payments.length,
      byDay: Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v })),
      expenses: expenses.slice(0, 100),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
