import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [vehicles, customers, expenses, payments, invoices, ledgers] =
      await Promise.all([
        db.vehicle.findMany({ include: { expenses: true, customer: true } }),
        db.customer.count(),
        db.expense.findMany(),
        db.payment.findMany(),
        db.invoice.findMany(),
        db.ledger.findMany(),
      ]);

    const totalRevenue = expenses.reduce(
      (s, e) => s + (e.customerCharge || 0),
      0
    );
    const totalCost = expenses.reduce((s, e) => s + (e.companyCost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const totalPaymentsReceived = payments.reduce(
      (s, p) => s + (p.amount || 0),
      0
    );
    const totalOutstanding = invoices
      .filter((i) => i.status !== "PAID" && i.status !== "DRAFT")
      .reduce((s, i) => s + (i.total || 0), 0);

    // status counts
    const statusCounts: Record<string, number> = {};
    vehicles.forEach((v) => {
      statusCounts[v.status] = (statusCounts[v.status] || 0) + 1;
    });

    // recent vehicles
    const recentVehicles = vehicles.slice(0, 5);

    // top profit vehicles
    const profitByVehicle = vehicles
      .map((v) => {
        const charge = v.expenses.reduce(
          (s, e) => s + (e.customerCharge || 0),
          0
        );
        const cost = v.expenses.reduce((s, e) => s + (e.companyCost || 0), 0);
        return {
          id: v.id,
          vin: v.vin,
          make: v.make,
          model: v.model,
          customerName: v.customer?.name,
          profit: charge - cost,
          charge,
          cost,
        };
      })
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    // outstanding customer ledgers
    const customerLedgers = ledgers.filter((l) => l.type === "CUSTOMER");
    const totalReceivable = customerLedgers.reduce(
      (s, l) => s + (l.balance > 0 ? l.balance : 0),
      0
    );
    const totalPayable = customerLedgers.reduce(
      (s, l) => s + (l.balance < 0 ? Math.abs(l.balance) : 0),
      0
    );

    return NextResponse.json({
      counts: {
        vehicles: vehicles.length,
        customers,
        expenses: expenses.length,
        payments: payments.length,
        invoices: invoices.length,
      },
      financials: {
        totalRevenue,
        totalCost,
        totalProfit,
        totalPaymentsReceived,
        totalOutstanding,
        totalReceivable,
        totalPayable,
        margin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      },
      statusCounts,
      recentVehicles,
      topProfitVehicles: profitByVehicle,
      customerLedgers: customerLedgers.slice(0, 5),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
