-- ============================================================
-- PropertyNestHomes
-- Investment Payment + Multi-Currency Payment Support
-- ============================================================

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS investment_id INTEGER;

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3);

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS original_amount NUMERIC(18,2);

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS charged_amount NUMERIC(18,2);

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(24,10);

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS exchange_rate_source VARCHAR(100);

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS exchange_rate_at TIMESTAMP;

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS payment_currency VARCHAR(3);

CREATE INDEX IF NOT EXISTS idx_payments_investment_id
ON payments(investment_id);

CREATE INDEX IF NOT EXISTS idx_payments_currency
ON payments(currency);

-- Link investment payments to the investment record.
ALTER TABLE payments
    DROP CONSTRAINT IF EXISTS payments_investment_id_fkey;

ALTER TABLE payments
    ADD CONSTRAINT payments_investment_id_fkey
    FOREIGN KEY (investment_id)
    REFERENCES investments(id)
    ON DELETE SET NULL;
