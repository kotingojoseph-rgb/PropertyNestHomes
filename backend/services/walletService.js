const pool = require("../config/db");

function normalizeCurrency(currency) {
  return String(currency || "NGN").trim().toUpperCase();
}

/**
 * Get/create a platform wallet for a currency.
 *
 * Each currency has its own independent wallet balance.
 * NGN, USD, EUR, etc. must never be mixed in the same balance.
 */
async function getWallet(client = pool, currency = "NGN") {
  const normalizedCurrency = normalizeCurrency(currency);

  const existing = await client.query(
    `
    SELECT *
    FROM platform_wallet
    WHERE currency = $1
    `,
    [normalizedCurrency]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const created = await client.query(
    `
    INSERT INTO platform_wallet
    (
      currency,
      available_balance,
      pending_balance,
      total_earned,
      total_withdrawn
    )
    VALUES
    ($1, 0, 0, 0, 0)
    ON CONFLICT (currency)
    DO UPDATE SET currency = EXCLUDED.currency
    RETURNING *
    `,
    [normalizedCurrency]
  );

  return created.rows[0];
}


/**
 * Credit the platform wallet in the specified currency.
 *
 * IMPORTANT:
 * USD must only increase the USD wallet.
 * NGN must only increase the NGN wallet.
 */
async function creditWallet(
  client,
  {
    amount,
    currency = "NGN",
    transactionType,
    reference = null,
    sourceType = null,
    sourceId = null,
    description = null,
  }
) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid credit amount");
  }

  const normalizedCurrency = normalizeCurrency(currency);

  const wallet = await getWallet(client, normalizedCurrency);

  /*
   * Lock this currency's wallet row.
   */
  const walletResult = await client.query(
    `
    SELECT *
    FROM platform_wallet
    WHERE id = $1
    FOR UPDATE
    `,
    [wallet.id]
  );

  if (walletResult.rows.length === 0) {
    throw new Error(
      `Platform wallet not found for ${normalizedCurrency}`
    );
  }

  const lockedWallet = walletResult.rows[0];

  const before = Number(lockedWallet.available_balance);
  const after = before + numericAmount;

  const updated = await client.query(
    `
    UPDATE platform_wallet
    SET
      available_balance = $1,
      total_earned = total_earned + $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
    `,
    [
      after,
      numericAmount,
      lockedWallet.id,
    ]
  );

  const ledger = await client.query(
    `
    INSERT INTO platform_wallet_transactions
    (
      wallet_id,
      transaction_type,
      amount,
      balance_before,
      balance_after,
      reference,
      source_type,
      source_id,
      description,
      status
    )
    VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,'completed')
    RETURNING *
    `,
    [
      lockedWallet.id,
      transactionType,
      numericAmount,
      before,
      after,
      reference,
      sourceType,
      sourceId,
      description,
    ]
  );

  return {
    wallet: updated.rows[0],
    transaction: ledger.rows[0],
  };
}


/**
 * Reserve money for withdrawal.
 *
 * Withdrawal must happen in the same currency as the wallet.
 */
async function reserveForWithdrawal(
  client,
  amount,
  reference,
  description,
  currency = "NGN"
) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid withdrawal amount");
  }

  const normalizedCurrency = normalizeCurrency(currency);

  const wallet = await getWallet(client, normalizedCurrency);

  const walletResult = await client.query(
    `
    SELECT *
    FROM platform_wallet
    WHERE id = $1
    FOR UPDATE
    `,
    [wallet.id]
  );

  if (walletResult.rows.length === 0) {
    throw new Error(
      `Platform wallet not found for ${normalizedCurrency}`
    );
  }

  const lockedWallet = walletResult.rows[0];

  const available = Number(
    lockedWallet.available_balance
  );

  if (numericAmount > available) {
    throw new Error(
      `Insufficient ${normalizedCurrency} wallet balance`
    );
  }

  const before = available;
  const after = available - numericAmount;

  const updated = await client.query(
    `
    UPDATE platform_wallet
    SET
      available_balance = $1,
      pending_balance = pending_balance + $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
    `,
    [
      after,
      numericAmount,
      lockedWallet.id,
    ]
  );

  const ledger = await client.query(
    `
    INSERT INTO platform_wallet_transactions
    (
      wallet_id,
      transaction_type,
      amount,
      balance_before,
      balance_after,
      reference,
      source_type,
      source_id,
      description,
      status
    )
    VALUES
    ($1,'withdrawal_reserve',$2,$3,$4,$5,'withdrawal',NULL,$6,'completed')
    RETURNING *
    `,
    [
      lockedWallet.id,
      numericAmount,
      before,
      after,
      reference,
      description || "Withdrawal funds reserved",
    ]
  );

  return {
    wallet: updated.rows[0],
    transaction: ledger.rows[0],
  };
}


/**
 * Release a failed/reversed withdrawal reservation.
 */
async function releaseWithdrawal(
  client,
  amount,
  reference,
  description,
  currency = "NGN"
) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid release amount");
  }

  const normalizedCurrency = normalizeCurrency(currency);

  const wallet = await getWallet(client, normalizedCurrency);

  const walletResult = await client.query(
    `
    SELECT *
    FROM platform_wallet
    WHERE id = $1
    FOR UPDATE
    `,
    [wallet.id]
  );

  if (walletResult.rows.length === 0) {
    throw new Error(
      `Platform wallet not found for ${normalizedCurrency}`
    );
  }

  const lockedWallet = walletResult.rows[0];

  const pending = Number(
    lockedWallet.pending_balance
  );

  if (numericAmount > pending) {
    throw new Error(
      `Withdrawal release exceeds ${normalizedCurrency} pending balance`
    );
  }

  const before = Number(
    lockedWallet.available_balance
  );

  const after = before + numericAmount;

  const updated = await client.query(
    `
    UPDATE platform_wallet
    SET
      available_balance = $1,
      pending_balance = pending_balance - $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
    `,
    [
      after,
      numericAmount,
      lockedWallet.id,
    ]
  );

  const ledger = await client.query(
    `
    INSERT INTO platform_wallet_transactions
    (
      wallet_id,
      transaction_type,
      amount,
      balance_before,
      balance_after,
      reference,
      source_type,
      source_id,
      description,
      status
    )
    VALUES
    ($1,'withdrawal_release',$2,$3,$4,$5,'withdrawal',NULL,$6,'completed')
    RETURNING *
    `,
    [
      lockedWallet.id,
      numericAmount,
      before,
      after,
      reference,
      description || "Withdrawal reservation released",
    ]
  );

  return {
    wallet: updated.rows[0],
    transaction: ledger.rows[0],
  };
}


/**
 * Mark a withdrawal as successfully completed.
 */
async function completeWithdrawal(
  client,
  amount,
  reference,
  description,
  currency = "NGN"
) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid withdrawal amount");
  }

  const normalizedCurrency = normalizeCurrency(currency);

  const wallet = await getWallet(client, normalizedCurrency);

  const walletResult = await client.query(
    `
    SELECT *
    FROM platform_wallet
    WHERE id = $1
    FOR UPDATE
    `,
    [wallet.id]
  );

  if (walletResult.rows.length === 0) {
    throw new Error(
      `Platform wallet not found for ${normalizedCurrency}`
    );
  }

  const lockedWallet = walletResult.rows[0];

  const pending = Number(
    lockedWallet.pending_balance
  );

  if (numericAmount > pending) {
    throw new Error(
      `Withdrawal completion exceeds ${normalizedCurrency} pending balance`
    );
  }

  const updated = await client.query(
    `
    UPDATE platform_wallet
    SET
      pending_balance = pending_balance - $1,
      total_withdrawn = total_withdrawn + $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
    `,
    [
      numericAmount,
      lockedWallet.id,
    ]
  );

  const ledger = await client.query(
    `
    INSERT INTO platform_wallet_transactions
    (
      wallet_id,
      transaction_type,
      amount,
      balance_before,
      balance_after,
      reference,
      source_type,
      source_id,
      description,
      status
    )
    VALUES
    (
      $1,
      'withdrawal_completed',
      $2,
      $3,
      $3,
      $4,
      'withdrawal',
      NULL,
      $5,
      'completed'
    )
    RETURNING *
    `,
    [
      lockedWallet.id,
      numericAmount,
      Number(lockedWallet.available_balance),
      reference,
      description || "Withdrawal completed",
    ]
  );

  return {
    wallet: updated.rows[0],
    transaction: ledger.rows[0],
  };
}


module.exports = {
  getWallet,
  creditWallet,
  reserveForWithdrawal,
  releaseWithdrawal,
  completeWithdrawal,
  normalizeCurrency,
};
