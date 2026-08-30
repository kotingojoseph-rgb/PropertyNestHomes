const pool = require("../config/db");

function normalizeCurrency(currency) {
  return String(currency || "NGN").trim().toUpperCase();
}

/**
 * Get or create one investment account for an investor/currency.
 *
 * This account belongs ONLY to the specified user.
 *
 * Example:
 * user 12 + NGN = account A
 * user 15 + NGN = account B
 *
 * Their balances can never be mixed.
 */
async function getInvestorInvestmentAccount(
  client = pool,
  userId,
  currency = "NGN"
) {
  const normalizedCurrency = normalizeCurrency(currency);

  if (!userId) {
    throw new Error("Investor user ID is required");
  }

  const existing = await client.query(
    `
    SELECT *
    FROM investor_investment_accounts
    WHERE user_id = $1
      AND currency = $2
    LIMIT 1
    `,
    [userId, normalizedCurrency]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const created = await client.query(
    `
    INSERT INTO investor_investment_accounts
    (
      user_id,
      currency,
      available_balance,
      pending_balance,
      total_funded,
      total_invested
    )
    VALUES
    ($1, $2, 0, 0, 0, 0)
    ON CONFLICT (user_id, currency)
    DO UPDATE SET
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
    `,
    [userId, normalizedCurrency]
  );

  return created.rows[0];
}


/**
 * Credit an investor's investment account.
 *
 * This is intentionally separate from creditWallet().
 */
async function creditInvestorInvestmentAccount(
  client,
  {
    userId,
    amount,
    currency = "NGN",
    transactionType = "funding",
    reference = null,
    sourceType = null,
    sourceId = null,
    description = null,
  }
) {
  const numericAmount = Number(amount);

  if (!userId) {
    throw new Error("Investor user ID is required");
  }

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid investor account credit amount");
  }

  const normalizedCurrency = normalizeCurrency(currency);

  const account = await getInvestorInvestmentAccount(
    client,
    userId,
    normalizedCurrency
  );

  /*
   * Lock this exact investor account.
   *
   * This prevents two simultaneous Paystack callbacks
   * from corrupting the balance.
   */
  const accountResult = await client.query(
    `
    SELECT *
    FROM investor_investment_accounts
    WHERE id = $1
      AND user_id = $2
      AND currency = $3
    FOR UPDATE
    `,
    [
      account.id,
      userId,
      normalizedCurrency,
    ]
  );

  if (accountResult.rows.length === 0) {
    throw new Error(
      "Investor investment account could not be locked"
    );
  }

  const lockedAccount = accountResult.rows[0];

  const before = Number(
    lockedAccount.available_balance
  );

  const after = Number(
    (before + numericAmount).toFixed(2)
  );

  const updated = await client.query(
    `
    UPDATE investor_investment_accounts
    SET
      available_balance = $1,
      total_funded = total_funded + $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
      AND user_id = $4
    RETURNING *
    `,
    [
      after,
      numericAmount,
      lockedAccount.id,
      userId,
    ]
  );

  const ledger = await client.query(
    `
    INSERT INTO investor_investment_account_transactions
    (
      account_id,
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
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      'completed'
    )
    RETURNING *
    `,
    [
      lockedAccount.id,
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
    account: updated.rows[0],
    transaction: ledger.rows[0],
  };
}


/**
 * Spend money from an investor investment account.
 *
 * This will be used when the investor pays for an investment.
 */
async function debitInvestorInvestmentAccount(
  client,
  {
    userId,
    amount,
    currency = "NGN",
    transactionType = "investment",
    reference = null,
    sourceType = null,
    sourceId = null,
    description = null,
  }
) {
  const numericAmount = Number(amount);

  if (!userId) {
    throw new Error("Investor user ID is required");
  }

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid investor account debit amount");
  }

  const normalizedCurrency = normalizeCurrency(currency);

  const account = await getInvestorInvestmentAccount(
    client,
    userId,
    normalizedCurrency
  );

  const accountResult = await client.query(
    `
    SELECT *
    FROM investor_investment_accounts
    WHERE id = $1
      AND user_id = $2
      AND currency = $3
    FOR UPDATE
    `,
    [
      account.id,
      userId,
      normalizedCurrency,
    ]
  );

  if (accountResult.rows.length === 0) {
    throw new Error(
      "Investor investment account could not be locked"
    );
  }

  const lockedAccount = accountResult.rows[0];

  const available = Number(
    lockedAccount.available_balance
  );

  if (numericAmount > available) {
    throw new Error(
      `Insufficient ${normalizedCurrency} investment account balance`
    );
  }

  const before = available;

  const after = Number(
    (available - numericAmount).toFixed(2)
  );

  const updated = await client.query(
    `
    UPDATE investor_investment_accounts
    SET
      available_balance = $1,
      total_invested = total_invested + $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
      AND user_id = $4
    RETURNING *
    `,
    [
      after,
      numericAmount,
      lockedAccount.id,
      userId,
    ]
  );

  const ledger = await client.query(
    `
    INSERT INTO investor_investment_account_transactions
    (
      account_id,
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
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      'completed'
    )
    RETURNING *
    `,
    [
      lockedAccount.id,
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
    account: updated.rows[0],
    transaction: ledger.rows[0],
  };
}


/**
 * Get all investment accounts belonging to one investor.
 */
async function getInvestorInvestmentAccounts(
  userId
) {
  if (!userId) {
    throw new Error("Investor user ID is required");
  }

  const result = await pool.query(
    `
    SELECT *
    FROM investor_investment_accounts
    WHERE user_id = $1
    ORDER BY currency ASC
    `,
    [userId]
  );

  return result.rows;
}


/**
 * Get one investor account by currency.
 */
async function getInvestorInvestmentAccountByCurrency(
  userId,
  currency = "NGN"
) {
  const normalizedCurrency = normalizeCurrency(currency);

  const result = await pool.query(
    `
    SELECT *
    FROM investor_investment_accounts
    WHERE user_id = $1
      AND currency = $2
    LIMIT 1
    `,
    [userId, normalizedCurrency]
  );

  return result.rows[0] || null;
}


module.exports = {
  normalizeCurrency,
  getInvestorInvestmentAccount,
  getInvestorInvestmentAccounts,
  getInvestorInvestmentAccountByCurrency,
  creditInvestorInvestmentAccount,
  debitInvestorInvestmentAccount,
};
