-- Correct company-cost ledger entries created before company costs used CREDIT.
WITH legacy_costs AS (
  SELECT
    lt."ledgerId",
    SUM(lt.amount) AS amount
  FROM "LedgerTransaction" lt
  JOIN "Expense" e ON e.id = lt."referenceId"
  WHERE lt.type = 'DEBIT'
    AND lt.description LIKE 'Cost: %'
  GROUP BY lt."ledgerId"
)
UPDATE "Ledger" l
SET balance = l.balance - (legacy_costs.amount * 2)
FROM legacy_costs
WHERE l.id = legacy_costs."ledgerId"
  AND l.type = 'COMPANY';

UPDATE "LedgerTransaction" lt
SET type = 'CREDIT'
FROM "Expense" e
WHERE e.id = lt."referenceId"
  AND lt.type = 'DEBIT'
  AND lt.description LIKE 'Cost: %';
