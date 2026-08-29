-- ============================================================
-- PropertyNestHomes
-- International / Multi-Currency Investment Support
-- ============================================================

-- Supported currencies for investments and settlements.
CREATE TABLE IF NOT EXISTS supported_currencies (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10),
    decimals INTEGER NOT NULL DEFAULT 2
        CHECK (decimals BETWEEN 0 AND 6),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO supported_currencies (code, name, symbol, decimals)
VALUES
    ('NGN', 'Nigerian Naira', '₦', 2),
    ('USD', 'United States Dollar', '$', 2),
    ('EUR', 'Euro', '€', 2),
    ('GBP', 'British Pound', '£', 2),
    ('CAD', 'Canadian Dollar', 'C$', 2),
    ('AUD', 'Australian Dollar', 'A$', 2),
    ('ZAR', 'South African Rand', 'R', 2),
    ('KES', 'Kenyan Shilling', 'KSh', 2),
    ('GHS', 'Ghanaian Cedi', 'GH₵', 2),
    ('AED', 'United Arab Emirates Dirham', 'د.إ', 2)
ON CONFLICT (code) DO NOTHING;


-- ------------------------------------------------------------
-- Investment currency/conversion fields
-- ------------------------------------------------------------

ALTER TABLE investments
    ADD COLUMN IF NOT EXISTS property_currency VARCHAR(3);

ALTER TABLE investments
    ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(24,10);

ALTER TABLE investments
    ADD COLUMN IF NOT EXISTS exchange_rate_source VARCHAR(100);

ALTER TABLE investments
    ADD COLUMN IF NOT EXISTS exchange_rate_at TIMESTAMP;

ALTER TABLE investments
    ADD COLUMN IF NOT EXISTS property_amount NUMERIC(18,2);

ALTER TABLE investments
    ADD COLUMN IF NOT EXISTS settlement_currency VARCHAR(3);

ALTER TABLE investments
    ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50);

ALTER TABLE investments
    ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);


-- Existing records were created before international support.
-- Preserve them and populate their property currency.
UPDATE investments i
SET
    property_currency = COALESCE(
        i.property_currency,
        (
            SELECT UPPER(COALESCE(p.currency, 'NGN'))
            FROM properties p
            WHERE p.id = i.property_id
        ),
        'NGN'
    ),
    settlement_currency = COALESCE(
        i.settlement_currency,
        UPPER(COALESCE(i.currency, 'NGN'))
    ),
    exchange_rate = COALESCE(i.exchange_rate, 1),
    exchange_rate_source = COALESCE(i.exchange_rate_source, 'same_currency'),
    exchange_rate_at = COALESCE(i.exchange_rate_at, i.created_at),
    property_amount = COALESCE(i.property_amount, i.amount);


-- ------------------------------------------------------------
-- Constraints
-- ------------------------------------------------------------

ALTER TABLE investments
    DROP CONSTRAINT IF EXISTS investments_currency_format;

ALTER TABLE investments
    ADD CONSTRAINT investments_currency_format
    CHECK (
        currency ~ '^[A-Z]{3}$'
    );

ALTER TABLE investments
    DROP CONSTRAINT IF EXISTS investments_property_currency_format;

ALTER TABLE investments
    ADD CONSTRAINT investments_property_currency_format
    CHECK (
        property_currency IS NULL
        OR property_currency ~ '^[A-Z]{3}$'
    );

ALTER TABLE investments
    DROP CONSTRAINT IF EXISTS investments_settlement_currency_format;

ALTER TABLE investments
    ADD CONSTRAINT investments_settlement_currency_format
    CHECK (
        settlement_currency IS NULL
        OR settlement_currency ~ '^[A-Z]{3}$'
    );

ALTER TABLE investments
    DROP CONSTRAINT IF EXISTS investments_exchange_rate_positive;

ALTER TABLE investments
    ADD CONSTRAINT investments_exchange_rate_positive
    CHECK (
        exchange_rate IS NULL
        OR exchange_rate > 0
    );


-- ------------------------------------------------------------
-- Multi-currency platform wallets
-- ------------------------------------------------------------

ALTER TABLE platform_wallet
    DROP CONSTRAINT IF EXISTS platform_wallet_currency_unique;

CREATE UNIQUE INDEX IF NOT EXISTS
    idx_platform_wallet_currency
ON platform_wallet(currency);


-- Ensure the existing NGN wallet remains available.
INSERT INTO platform_wallet (
    currency,
    available_balance,
    pending_balance,
    total_earned,
    total_withdrawn
)
VALUES (
    'NGN',
    0,
    0,
    0,
    0
)
ON CONFLICT (currency) DO NOTHING;


-- ------------------------------------------------------------
-- Currency index
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS
    idx_investments_currency
ON investments(currency);

CREATE INDEX IF NOT EXISTS
    idx_investments_property_currency
ON investments(property_currency);

CREATE INDEX IF NOT EXISTS
    idx_investments_settlement_currency
ON investments(settlement_currency);


-- ------------------------------------------------------------
-- Updated-at trigger
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_investments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS investments_updated_at_trigger
ON investments;

CREATE TRIGGER investments_updated_at_trigger
BEFORE UPDATE ON investments
FOR EACH ROW
EXECUTE FUNCTION update_investments_updated_at();
