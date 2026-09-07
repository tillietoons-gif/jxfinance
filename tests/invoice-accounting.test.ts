import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's native TypeScript runner requires the extension.
import { calculateInvoiceLedgerDebit } from "../src/lib/invoice-accounting.ts";

test("draft invoices do not create customer ledger debits", () => {
  assert.equal(calculateInvoiceLedgerDebit("DRAFT", 1000, 300), 0);
});

test("issued invoices debit only the non-expense amount", () => {
  assert.equal(calculateInvoiceLedgerDebit("ISSUED", 1000, 300), 700);
});

test("paid and overdue invoices retain their posted debit", () => {
  assert.equal(calculateInvoiceLedgerDebit("PAID", 1000, 300), 700);
  assert.equal(calculateInvoiceLedgerDebit("OVERDUE", 1000, 300), 700);
});

test("expense charges cannot make the invoice ledger debit negative", () => {
  assert.equal(calculateInvoiceLedgerDebit("ISSUED", 100, 300), 0);
});