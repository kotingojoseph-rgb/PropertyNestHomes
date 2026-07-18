CREATE TABLE IF NOT EXISTS admin_wallet (
    id SERIAL PRIMARY KEY,
    balance DECIMAL(12,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS withdrawals (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(12,2) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO admin_wallet (balance)
SELECT 0
WHERE NOT EXISTS (
    SELECT 1 FROM admin_wallet
);
