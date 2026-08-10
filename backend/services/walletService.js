const pool = require("../config/db");

const WALLET_ID = 1;
const CURRENCY = "NGN";

/**
 * Get the platform wallet.
 */
async function getWallet(client = pool) {
  const result = await client.query(
    `SELECT *
     FROM platform_wallet
     WHERE id = $1
     AND currency = $2`,
    [WALLET_ID, CURRENCY]
  );

  if (result.rows.length === 0) {
    throw new Error("Platform wallet not found");
  }

  return result.rows[0];
}

/**
 * Credit the platform wallet.
 *
 * This must be called inside an existing transaction when the
 * credit needs to be atomic with another database operation.
 */
async function creditWallet(
  client,
  {
    amount,
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

  const walletResult = await client.query(
    `SELECT *
     FROM platform_wallet
     WHERE id = $1
     AND currency = $2
     FOR UPDATE`,
    [WALLET_ID, CURRENCY]
  );

  if (walletResult.rows.length === 0) {
    throw new Error("Platform wallet not found");
  }

  const wallet = walletResult.rows[0];

  const before = Number(wallet.available_balance);
  const after = before + numericAmount;

  const updated = await client.query(
    `UPDATE platform_wallet
     SET available_balance = $1,
         total_earned = total_earned + $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [after, numericAmount, WALLET_ID]
  );

  const ledger = await client.query(
    `INSERT INTO platform_wallet_transactions
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
     RETURNING *`,
    [
      WALLET_ID,
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
 * Reserve money for a withdrawal.
 *
 * We move the amount from available_balance to pending_balance.
 * Money is NOT counted as withdrawn until Paystack confirms success.
 */
async function reserveForWithdrawal(client, amount, reference, description) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid withdrawal amount");
  }

  const walletResult = await client.query(
    `SELECT *
     FROM platform_wallet
     WHERE id = $1
     AND currency = $2
     FOR UPDATE`,
    [WALLET_ID, CURRENCY]
  );

  if (walletResult.rows.length === 0) {
    throw new Error("Platform wallet not found");
  }

  const wallet = walletResult.rows[0];
  const available = Number(wallet.available_balance);

  if (numericAmount > available) {
    throw new Error("Insufficient wallet balance");
  }

  const before = available;
  const after = available - numericAmount;

  const updated = await client.query(
    `UPDATE platform_wallet
     SET available_balance = $1,
         pending_balance = pending_balance + $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [after, numericAmount, WALLET_ID]
  );

  const ledger = await client.query(
    `INSERT INTO platform_wallet_transactions
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
     RETURNING *`,
    [
      WALLET_ID,
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
async function releaseWithdrawal(client, amount, reference, description) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid release amount");
  }

  const walletResult = await client.query(
    `SELECT *
     FROM platform_wallet
     WHERE id = $1
     AND currency = $2
     FOR UPDATE`,
    [WALLET_ID, CURRENCY]
  );

  if (walletResult.rows.length === 0) {
    throw new Error("Platform wallet not found");
  }

  const wallet = walletResult.rows[0];
  const pending = Number(wallet.pending_balance);

  if (numericAmount > pending) {
    throw new Error("Withdrawal release exceeds pending balance");
  }

  const before = Number(wallet.available_balance);
  const after = before + numericAmount;

  const updated = await client.query(
    `UPDATE platform_wallet
     SET available_balance = $1,
         pending_balance = pending_balance - $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [after, numericAmount, WALLET_ID]
  );

  const ledger = await client.query(
    `INSERT INTO platform_wallet_transactions
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
     RETURNING *`,
    [
      WALLET_ID,
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
 * Finalize a successful withdrawal.
 *
 * Money leaves pending_balance and becomes total_withdrawn.
 */
async function completeWithdrawal(client, amount, reference, description) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Invalid completion amount");
  }

  const walletResult = await client.query(
    `SELECT *
     FROM platform_wallet
     WHERE id = $1
     AND currency = $2
     FOR UPDATE`,
    [WALLET_ID, CURRENCY]
  );

  if (walletResult.rows.length === 0) {
    throw new Error("Platform wallet not found");
  }

  const wallet = walletResult.rows[0];
  const pending = Number(wallet.pending_balance);

  if (numericAmount > pending) {
    throw new Error("Withdrawal completion exceeds pending balance");
  }

  const before = Number(wallet.available_balance);

  const updated = await client.query(
    `UPDATE platform_wallet
     SET pending_balance = pending_balance - $1,
         total_withdrawn = total_withdrawn + $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [numericAmount, WALLET_ID]
  );

  const ledger = await client.query(
    `INSERT INTO platform_wallet_transactions
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
     ($1,'withdrawal_completed',$2,$3,$3,$4,'withdrawal',NULL,$5,'completed')
     RETURNING *`,
    [
      WALLET_ID,
      numericAmount,
      before,
      reference,
      description || "Withdrawal completed",
    ]
  );

  return {
    wallet: updated.rows[0],
    transaction: ledger.rows[0],
  };
}

async function getTransactions(limit = 100, offset = 0) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const result = await pool.query(
    `SELECT *
     FROM platform_wallet_transactions
     WHERE wallet_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [WALLET_ID, safeLimit, safeOffset]
  );

  return result.rows;
}

/**
 * Handle a reversed withdrawal.
 *
 * If the withdrawal is still pending/processing:
 *   pending_balance -> available_balance
 *
 * If it was already completed:
 *   total_withdrawn -> available_balance
 *
 * This keeps the internal wallet accounting correct if Paystack
 * reverses a previously successful transfer.
 */
async function reverseWithdrawal(
  client,
  amount,
  reference,
  description,
  withdrawalStatus = "processing"
) {
  const numericAmount = Number(amount);

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {
    throw new Error("Invalid reversal amount");
  }

  const walletResult = await client.query(
    `SELECT *
     FROM platform_wallet
     WHERE id = $1
     AND currency = $2
     FOR UPDATE`,
    [WALLET_ID, CURRENCY]
  );

  if (walletResult.rows.length === 0) {
    throw new Error("Platform wallet not found");
  }

  const wallet = walletResult.rows[0];

  /*
   * The withdrawal has not completed yet.
   * Return the reserved amount from pending_balance
   * back to available_balance.
   */
  if (
    withdrawalStatus === "pending" ||
    withdrawalStatus === "processing"
  ) {
    const pending = Number(wallet.pending_balance);

    if (numericAmount > pending) {
      throw new Error(
        "Withdrawal reversal exceeds pending balance"
      );
    }

    const before = Number(wallet.available_balance);
    const after = before + numericAmount;

    const updated = await client.query(
      `UPDATE platform_wallet
       SET
         available_balance = $1,
         pending_balance = pending_balance - $2,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [after, numericAmount, WALLET_ID]
    );

    const ledger = await client.query(
      `INSERT INTO platform_wallet_transactions
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
         'withdrawal_reversed',
         $2,
         $3,
         $4,
         $5,
         'withdrawal',
         NULL,
         $6,
         'completed'
       )
       RETURNING *`,
      [
        WALLET_ID,
        numericAmount,
        before,
        after,
        reference,
        description || "Pending withdrawal reversed",
      ]
    );

    return {
      wallet: updated.rows[0],
      transaction: ledger.rows[0],
      mode: "pending_reversal",
    };
  }

  /*
   * The withdrawal had already completed.
   * Return the reversed amount from total_withdrawn
   * to available_balance.
   */
  if (withdrawalStatus === "completed") {
    const totalWithdrawn = Number(wallet.total_withdrawn);

    if (numericAmount > totalWithdrawn) {
      throw new Error(
        "Withdrawal reversal exceeds wallet withdrawal history"
      );
    }

    const before = Number(wallet.available_balance);
    const after = before + numericAmount;

    const updated = await client.query(
      `UPDATE platform_wallet
       SET
         available_balance = $1,
         total_withdrawn = total_withdrawn - $2,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [after, numericAmount, WALLET_ID]
    );

    const ledger = await client.query(
      `INSERT INTO platform_wallet_transactions
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
         'withdrawal_reversed',
         $2,
         $3,
         $4,
         $5,
         'withdrawal',
         NULL,
         $6,
         'completed'
       )
       RETURNING *`,
      [
        WALLET_ID,
        numericAmount,
        before,
        after,
        reference,
        description || "Completed withdrawal reversed",
      ]
    );

    return {
      wallet: updated.rows[0],
      transaction: ledger.rows[0],
      mode: "completed_reversal",
    };
  }

  throw new Error(
    `Cannot reverse withdrawal from status: ${withdrawalStatus}`
  );
}

module.exports = {
  WALLET_ID,
  CURRENCY,
  getWallet,
  creditWallet,
  reserveForWithdrawal,
  releaseWithdrawal,
  completeWithdrawal,
  reverseWithdrawal,
  getTransactions,
};
