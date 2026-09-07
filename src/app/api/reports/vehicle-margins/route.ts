import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const vehicles = await db.vehicle.findMany({
      include: {
        customer: true,
        expenses: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = vehicles.map((v) => {
      const charge = v.expenses.reduce(
        (s, e) => s + (e.customerCharge || 0),
        0
      );
      const cost = v.expenses.reduce((s, e) => s + (e.companyCost || 0), 0);
      const profit = charge - cost;
      const margin = charge > 0 ? (profit / charge) * 100 : 0;
      const paymentsReceived = v.payments.reduce(
        (s, p) => s + (p.amount || 0),
        0
      );
      const outstanding = Math.max(charge - paymentsReceived, 0);
      return {
        id: v.id,
        vin: v.vin,
        make: v.make,
        model: v.model,
        year: v.year,
        destination: v.destination,
        status: v.status,
        customerName: v.customer?.name || "",
        customerCharge: charge,
        companyCost: cost,
        profit,
        margin,
        paymentsReceived,
        outstanding,
        expenseCount: v.expenses.length,
      };
    });

    const sorted = rows.sort((a, b) => b.profit - a.profit);
    const totalCharge = rows.reduce((s, r) => s + r.customerCharge, 0);
    const totalCost = rows.reduce((s, r) => s + r.companyCost, 0);
    const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
    const avgMargin =
      totalCharge > 0 ? (totalProfit / totalCharge) * 100 : 0;

    return NextResponse.json({
      vehicles: sorted,
      summary: {
        totalVehicles: rows.length,
        totalCharge,
        totalCost,
        totalProfit,
        avgMargin,
        highestProfit: sorted[0] || null,
        lowestProfit: sorted[sorted.length - 1] || null,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
