BEGIN;

-- ============================================================
-- PropertyNestHomes
-- Investor Investment Accounts
--
-- This is separate from platform_wallet.
-- platform_wallet = PropertyNestHomes/platform funds
-- investor_investment_accounts = client/investor funds
-- ============================================================


-- ============================================================
-- INVESTOR INVESTMENT ACCOUNTS
-- One account per investor per currency.
-- ============================================================

CREATE TABLE IF NOT EXISTS investor_investment_accounts (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',

    available_balance NUMERIC(18,2) NOT NULL DEFAULT 0
        CHECK (available_balance >= 0),

    pending_balance NUMERIC(18,2) NOT NULL DEFAULT 0
        CHECK (pending_balance >= 0),

    total_funded NUMERIC(18,2) NOT NULL DEFAULT 0
        CHECK (total_funded >= 0),

    total_invested NUMERIC(18,2) NOT NULL DEFAULT 0
        CHECK (total_invested >= 0),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT investor_investment_accounts_currency_format
        CHECK (currency ~ '^[A-Z]{3}$'),

    CONSTRAINT investor_investment_accounts_user_currency_unique
        UNIQUE (user_id, currency)
);


CREATE INDEX IF NOT EXISTS
    idx_investor_investment_accounts_user
ON investor_investment_accounts(user_id);

CREATE INDEX IF NOT EXISTS
    idx_investor_investment_accounts_currency
ON investor_investment_accounts(currency);


-- ============================================================
-- INVESTOR ACCOUNT LEDGER
-- Every funding and investment-account movement is recorded.
-- ============================================================

CREATE TABLE IF NOT EXISTS investor_investment_account_transactions (
    id BIGSERIAL PRIMARY KEY,

    account_id INTEGER NOT NULL
        REFERENCES investor_investment_accounts(id)
        ON DELETE CASCADE,

    transaction_type VARCHAR(50) NOT NULL,

    amount NUMERIC(18,2) NOT NULL
        CHECK (amount > 0),

    balance_before NUMERIC(18,2) NOT NULL,

    balance_after NUMERIC(18,2) NOT NULL,

    reference VARCHAR(255),

    source_type VARCHAR(100),

    source_id VARCHAR(100),

    description TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'completed',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX IF NOT EXISTS
    idx_investor_account_transactions_account
ON investor_investment_account_transactions(account_id);

CREATE INDEX IF NOT EXISTS
    idx_investor_account_transactions_reference
ON investor_investment_account_transactions(reference);

CREATE INDEX IF NOT EXISTS
    idx_investor_account_transactions_created
ON investor_investment_account_transactions(created_at DESC);


-- ============================================================
-- PAYMENT ACCOUNTING
-- Mark payments that have been posted into an investor account.
-- Existing payments remain untouched.
-- ============================================================

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS investor_account_id INTEGER;

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS investor_account_posted BOOLEAN
    NOT NULL DEFAULT FALSE;

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS investor_account_transaction_id BIGINT;


ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_investor_account_id_fkey;

ALTER TABLE payments
ADD CONSTRAINT payments_investor_account_id_fkey
FOREIGN KEY (investor_account_id)
REFERENCES investor_investment_accounts(id)
ON DELETE SET NULL;


CREATE INDEX IF NOT EXISTS
    idx_payments_investor_account_id
ON payments(investor_account_id);


COMMIT;
