-- ============================================================
-- PropertyNestHomes Investor Portfolio
-- ============================================================

CREATE TABLE IF NOT EXISTS investments (
    id SERIAL PRIMARY KEY,

    investor_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    property_id INTEGER NOT NULL
        REFERENCES properties(id)
        ON DELETE CASCADE,

    amount NUMERIC(18,2) NOT NULL
        CHECK (amount > 0),

    currency VARCHAR(10) NOT NULL DEFAULT 'NGN',

    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'approved',
                'rejected',
                'completed',
                'cancelled'
            )
        ),

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    approved_at TIMESTAMP NULL,

    completed_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_investments_investor_id
    ON investments(investor_id);

CREATE INDEX IF NOT EXISTS idx_investments_property_id
    ON investments(property_id);

CREATE INDEX IF NOT EXISTS idx_investments_status
    ON investments(status);

CREATE INDEX IF NOT EXISTS idx_investments_created_at
    ON investments(created_at DESC);


-- Prevent an investor from creating duplicate pending
-- requests for the same property.
CREATE UNIQUE INDEX IF NOT EXISTS
    idx_one_pending_investment_per_property
ON investments(investor_id, property_id)
WHERE status = 'pending';
