import { Prisma } from "@prisma/client";

export function calculateInvoiceLedgerDebit(
  status: string,
  total: number,
  expenseSubtotal: number
) {
  if (status === "DRAFT") return 0;
  return Math.max(0, total - expenseSubtotal);
}

export async function reconcileInvoiceLedger(
  tx: Prisma.TransactionClient,
  invoiceId: string,
  previousCustomerId: string | null,
  nextCustomerId: string,
  nextDebit: number
) {
  const existingTransactions = await tx.ledgerTransaction.findMany({
    where: {
      referenceId: invoiceId,
      ledger: { type: "CUSTOMER", ...(previousCustomerId ? { customerId: previousCustomerId } : {}) },
    },
  });

  for (const existingTransaction of existingTransactions) {
    await tx.ledgerTransaction.delete({ where: { id: existingTransaction.id } });
    await tx.ledger.update({
      where: { id: existingTransaction.ledgerId },
      data: { balance: { decrement: existingTransaction.amount } },
    });
  }

  if (nextDebit <= 0) return;

  const ledger = await tx.ledger.findFirst({
    where: { customerId: nextCustomerId, type: "CUSTOMER" },
  });
  if (!ledger) return;

  await tx.ledgerTransaction.create({
    data: {
      ledgerId: ledger.id,
      amount: nextDebit,
      type: "DEBIT",
      description: `Invoice ${invoiceId}`,
      referenceId: invoiceId,
    },
  });
  await tx.ledger.update({
    where: { id: ledger.id },
    data: { balance: { increment: nextDebit } },
  });
}