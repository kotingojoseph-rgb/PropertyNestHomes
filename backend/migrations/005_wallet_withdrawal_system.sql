BEGIN;

-- =========================================================
-- PLATFORM WALLET
-- =========================================================

CREATE TABLE IF NOT EXISTS platform_wallet (
    id SERIAL PRIMARY KEY,
    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
    available_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    pending_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_earned NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_withdrawn NUMERIC(14,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- One platform wallet per currency for now.
INSERT INTO platform_wallet (currency)
SELECT 'NGN'
WHERE NOT EXISTS (
    SELECT 1
    FROM platform_wallet
    WHERE currency = 'NGN'
);


-- =========================================================
-- PLATFORM WALLET LEDGER
-- Every balance movement gets a permanent record.
-- =========================================================

CREATE TABLE IF NOT EXISTS platform_wallet_transactions (
    id BIGSERIAL PRIMARY KEY,

    wallet_id INTEGER NOT NULL
        REFERENCES platform_wallet(id),

    transaction_type VARCHAR(50) NOT NULL,

    amount NUMERIC(14,2) NOT NULL
        CHECK (amount > 0),

    balance_before NUMERIC(14,2) NOT NULL,
    balance_after NUMERIC(14,2) NOT NULL,

    reference VARCHAR(255),
    source_type VARCHAR(100),
    source_id VARCHAR(100),

    description TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'completed',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_wallet_transactions_wallet
ON platform_wallet_transactions(wallet_id);

CREATE INDEX IF NOT EXISTS idx_platform_wallet_transactions_reference
ON platform_wallet_transactions(reference);

CREATE INDEX IF NOT EXISTS idx_platform_wallet_transactions_created
ON platform_wallet_transactions(created_at DESC);


-- =========================================================
-- PAYOUT ACCOUNTS
-- Bank accounts that can receive withdrawals.
-- =========================================================

CREATE TABLE IF NOT EXISTS payout_accounts (
    id SERIAL PRIMARY KEY,

    user_id INTEGER,

    provider VARCHAR(50) NOT NULL DEFAULT 'paystack',

    bank_code VARCHAR(50),
    bank_name VARCHAR(150) NOT NULL,

    account_number VARCHAR(30) NOT NULL,
    account_name VARCHAR(255) NOT NULL,

    recipient_code VARCHAR(255),

    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',

    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payout_accounts_user
ON payout_accounts(user_id);


-- =========================================================
-- PLATFORM WITHDRAWAL REQUESTS
-- =========================================================

CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id BIGSERIAL PRIMARY KEY,

    wallet_id INTEGER NOT NULL
        REFERENCES platform_wallet(id),

    payout_account_id INTEGER
        REFERENCES payout_accounts(id),

    amount NUMERIC(14,2) NOT NULL
        CHECK (amount > 0),

    fee NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (fee >= 0),

    net_amount NUMERIC(14,2) NOT NULL
        CHECK (net_amount > 0),

    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',

    status VARCHAR(40) NOT NULL DEFAULT 'pending',

    provider VARCHAR(50),

    provider_reference VARCHAR(255),

    provider_transfer_code VARCHAR(255),

    admin_note TEXT,

    failure_reason TEXT,

    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status
ON withdrawal_requests(status);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created
ON withdrawal_requests(created_at DESC);


-- =========================================================
-- AD REVENUE
-- Keeps advertising revenue separate from customer payments.
-- =========================================================

CREATE TABLE IF NOT EXISTS ad_revenue (
    id BIGSERIAL PRIMARY KEY,

    network VARCHAR(100) NOT NULL,

    external_reference VARCHAR(255),

    amount NUMERIC(14,2) NOT NULL
        CHECK (amount >= 0),

    currency VARCHAR(10) NOT NULL DEFAULT 'USD',

    revenue_date DATE NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(network, external_reference)
);

CREATE INDEX IF NOT EXISTS idx_ad_revenue_date
ON ad_revenue(revenue_date DESC);


-- =========================================================
-- PAYMENT ACCOUNTING
-- Add accounting metadata to existing payments.
-- =========================================================

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS wallet_posted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS wallet_transaction_id BIGINT;


-- =========================================================
-- MIGRATION FROM EXISTING ADMIN WALLET
--
-- Current local admin_wallet balance is zero, so there is
-- nothing to migrate right now.
-- =========================================================

COMMIT;
