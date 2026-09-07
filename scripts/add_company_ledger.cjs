const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const existing = await db.ledger.findFirst({ where: { type: "COMPANY" } });
  if (!existing) {
    await db.ledger.create({
      data: { name: "Operating Account", type: "COMPANY", balance: 0 }
    });
    console.log("Created company ledger");
  } else {
    console.log("Already exists");
  }
  // Also create one for the previous expense if missing
  const expenses = await db.expense.findMany({ include: { vehicle: true } });
  let companyLedger = await db.ledger.findFirst({ where: { type: "COMPANY" } });
  for (const e of expenses) {
    const existingTx = await db.ledgerTransaction.findFirst({
      where: { referenceId: e.id, ledgerId: companyLedger.id }
    });
    if (!existingTx && e.companyCost > 0) {
      await db.$transaction([
        db.ledgerTransaction.create({
          data: {
            ledgerId: companyLedger.id,
            amount: e.companyCost,
            type: "DEBIT",
            description: `Cost: ${e.title} (Vehicle ${e.vehicle.vin})`,
            referenceId: e.id,
          }
        }),
        db.ledger.update({
          where: { id: companyLedger.id },
          data: { balance: companyLedger.balance + e.companyCost }
        })
      ]);
      companyLedger.balance += e.companyCost;
      console.log(`Added missing company tx for expense ${e.id}: ${e.companyCost}`);
    }
  }
  console.log("Company ledger balance:", companyLedger.balance);
})().finally(() => db.$disconnect());
