BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_reference_unique
ON payments(reference)
WHERE reference IS NOT NULL;

COMMIT;
