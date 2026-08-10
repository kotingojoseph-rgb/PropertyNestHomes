const crypto = require("crypto");
const pool = require("../config/db");

const {
  creditWallet,
  completeWithdrawal,
  releaseWithdrawal,
  reverseWithdrawal,
} = require("../services/walletService");

function validSignature(req) {
  const signature = req.headers["x-paystack-signature"];

  if (!signature || !Buffer.isBuffer(req.body)) {
    return false;
  }

  const hash = crypto
    .createHmac(
      "sha512",
      process.env.PAYSTACK_SECRET_KEY
    )
    .update(req.body)
    .digest("hex");

  const expected = Buffer.from(hash, "utf8");
  const received = Buffer.from(
    String(signature),
    "utf8"
  );

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    expected,
    received
  );
}

async function handleChargeSuccess(client, data) {
  const reference = data.reference;

  if (!reference) {
    throw new Error(
      "Payment reference missing"
    );
  }

  const existing = await client.query(
    `SELECT id
     FROM payments
     WHERE reference = $1
     FOR UPDATE`,
    [reference]
  );

  if (existing.rows.length > 0) {
    return {
      duplicate: true,
    };
  }

  const amount =
    Number(data.amount) / 100;

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Invalid payment amount"
    );
  }

  const metadata =
    data.metadata || {};

  const userId =
    metadata.user_id || null;

  const propertyId =
    metadata.property_id || null;

  const paymentType =
    metadata.payment_type ||
    "customer_payment";

  const paymentResult =
    await client.query(
      `INSERT INTO payments
       (
         user_id,
         property_id,
         amount,
         payment_type,
         status,
         reference,
         currency,
         gateway,
         wallet_posted
       )
       VALUES
       ($1,$2,$3,$4,'completed',
        $5,'NGN','paystack',FALSE)
       RETURNING *`,
      [
        userId,
        propertyId,
        amount,
        paymentType,
        reference,
      ]
    );

  const walletResult =
    await creditWallet(client, {
      amount,
      transactionType:
        "payment",
      reference,
      sourceType:
        "payment",
      sourceId:
        String(
          paymentResult.rows[0].id
        ),
      description:
        `Paystack payment ${reference}`,
    });

  await client.query(
    `UPDATE payments
     SET
       wallet_transaction_id = $1,
       wallet_posted = TRUE
     WHERE id = $2`,
    [
      walletResult.transaction.id,
      paymentResult.rows[0].id,
    ]
  );

  return {
    duplicate: false,
    paymentId:
      paymentResult.rows[0].id,
    amount,
  };
}

async function handleTransferSuccess(
  client,
  data
) {
  const reference =
    data.reference;

  const transferCode =
    data.transfer_code ||
    null;

  if (!reference) {
    throw new Error(
      "Transfer reference missing"
    );
  }

  const result =
    await client.query(
      `SELECT *
       FROM withdrawal_requests
       WHERE provider_reference = $1
       OR provider_transfer_code = $2
       FOR UPDATE`,
      [
        reference,
        transferCode,
      ]
    );

  if (result.rows.length === 0) {
    console.warn(
      `[PAYSTACK] Unknown successful transfer: ${reference}`
    );

    return {
      unknown: true,
    };
  }

  const withdrawal =
    result.rows[0];

  /*
   * Idempotency:
   * A successful withdrawal must only be completed once.
   */
  if (
    withdrawal.status ===
      "completed"
  ) {
    return {
      duplicate: true,
      withdrawalId:
        withdrawal.id,
    };
  }

  const amount =
    Number(withdrawal.amount);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Invalid withdrawal amount"
    );
  }

  const walletResult =
    await completeWithdrawal(
      client,
      amount,
      withdrawal.provider_reference,
      `Paystack transfer ${transferCode || reference} completed`
    );

  const updated =
    await client.query(
      `UPDATE withdrawal_requests
       SET
         status = 'completed',
         provider_transfer_code =
           COALESCE($1, provider_transfer_code),
         processed_at =
           CURRENT_TIMESTAMP,
         updated_at =
           CURRENT_TIMESTAMP,
         failure_reason = NULL
       WHERE id = $2
       RETURNING *`,
      [
        transferCode,
        withdrawal.id,
      ]
    );

  return {
    duplicate: false,
    withdrawal:
      updated.rows[0],
    wallet:
      walletResult.wallet,
  };
}

async function handleTransferFailed(
  client,
  data
) {
  const reference =
    data.reference;

  const transferCode =
    data.transfer_code ||
    null;

  if (!reference) {
    throw new Error(
      "Failed transfer reference missing"
    );
  }

  const result =
    await client.query(
      `SELECT *
       FROM withdrawal_requests
       WHERE provider_reference = $1
       OR provider_transfer_code = $2
       FOR UPDATE`,
      [
        reference,
        transferCode,
      ]
    );

  if (result.rows.length === 0) {
    console.warn(
      `[PAYSTACK] Unknown failed transfer: ${reference}`
    );

    return {
      unknown: true,
    };
  }

  const withdrawal =
    result.rows[0];

  /*
   * A failed transfer may be retried by Paystack.
   * Once we have released the reservation, do not release it again.
   */
  if (
    withdrawal.status ===
      "failed"
  ) {
    return {
      duplicate: true,
      withdrawalId:
        withdrawal.id,
    };
  }

  if (
    withdrawal.status ===
      "completed"
  ) {
    console.warn(
      `[PAYSTACK] Ignoring failed event after completion: ${reference}`
    );

    return {
      duplicate: true,
      withdrawalId:
        withdrawal.id,
    };
  }

  const amount =
    Number(withdrawal.amount);

  const reason =
    data.reason ||
    data.message ||
    "Paystack transfer failed";

  const walletResult =
    await releaseWithdrawal(
      client,
      amount,
      withdrawal.provider_reference,
      `Paystack transfer failed: ${reason}`
    );

  const updated =
    await client.query(
      `UPDATE withdrawal_requests
       SET
         status = 'failed',
         provider_transfer_code =
           COALESCE($1, provider_transfer_code),
         failure_reason = $2,
         processed_at =
           CURRENT_TIMESTAMP,
         updated_at =
           CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [
        transferCode,
        reason,
        withdrawal.id,
      ]
    );

  return {
    duplicate: false,
    withdrawal:
      updated.rows[0],
    wallet:
      walletResult.wallet,
  };
}

async function handleTransferReversed(
  client,
  data
) {
  const reference =
    data.reference;

  const transferCode =
    data.transfer_code ||
    null;

  if (!reference) {
    throw new Error(
      "Reversed transfer reference missing"
    );
  }

  const result =
    await client.query(
      `SELECT *
       FROM withdrawal_requests
       WHERE provider_reference = $1
       OR provider_transfer_code = $2
       FOR UPDATE`,
      [
        reference,
        transferCode,
      ]
    );

  if (result.rows.length === 0) {
    console.warn(
      `[PAYSTACK] Unknown reversed transfer: ${reference}`
    );

    return {
      unknown: true,
    };
  }

  const withdrawal =
    result.rows[0];

  /*
   * Reversal is only applied once.
   */
  if (
    withdrawal.status ===
      "reversed"
  ) {
    return {
      duplicate: true,
      withdrawalId:
        withdrawal.id,
    };
  }

  /*
   * A reversed transfer may originate from:
   *
   * processing -> reversed
   * completed  -> reversed
   *
   * walletService.reverseWithdrawal()
   * handles both accounting states.
   */
  const amount =
    Number(withdrawal.amount);

  const previousStatus =
    withdrawal.status;

  const walletResult =
    await reverseWithdrawal(
      client,
      amount,
      withdrawal.provider_reference,
      `Paystack transfer ${transferCode || reference} reversed`,
      previousStatus
    );

  const updated =
    await client.query(
      `UPDATE withdrawal_requests
       SET
         status = 'reversed',
         provider_transfer_code =
           COALESCE($1, provider_transfer_code),
         failure_reason =
           COALESCE($2, failure_reason),
         processed_at =
           CURRENT_TIMESTAMP,
         updated_at =
           CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [
        transferCode,
        data.reason ||
          data.message ||
          "Paystack transfer reversed",
        withdrawal.id,
      ]
    );

  return {
    duplicate: false,
    withdrawal:
      updated.rows[0],
    wallet:
      walletResult.wallet,
  };
}

exports.paystackWebhook =
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      if (!validSignature(req)) {
        return res.status(401).json({
          error:
            "Invalid Paystack signature",
        });
      }

      let event;

      try {
        event = JSON.parse(
          req.body.toString("utf8")
        );
      } catch (_) {
        return res.status(400).json({
          error:
            "Invalid webhook payload",
        });
      }

      const eventName =
        event.event;

      const data =
        event.data || {};

      /*
       * Ignore events that are valid but not
       * relevant to our payment/withdrawal system.
       */
      const supportedEvents = [
        "charge.success",
        "transfer.success",
        "transfer.failed",
        "transfer.reversed",
      ];

      if (
        !supportedEvents.includes(
          eventName
        )
      ) {
        return res.sendStatus(200);
      }

      await client.query("BEGIN");

      let result;

      switch (eventName) {
        case "charge.success":
          result =
            await handleChargeSuccess(
              client,
              data
            );
          break;

        case "transfer.success":
          result =
            await handleTransferSuccess(
              client,
              data
            );
          break;

        case "transfer.failed":
          result =
            await handleTransferFailed(
              client,
              data
            );
          break;

        case "transfer.reversed":
          result =
            await handleTransferReversed(
              client,
              data
            );
          break;

        default:
          result = {};
      }

      await client.query("COMMIT");

      console.log(
        `[PAYSTACK] ${eventName} processed`,
        result
      );

      return res.sendStatus(200);
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {}

      /*
       * Database uniqueness protects duplicate payment
       * webhooks. Treat duplicates as successfully handled.
       */
      if (
        error.code === "23505"
      ) {
        console.log(
          `[PAYSTACK] Duplicate event ignored: ${
            error.detail ||
            error.message
          }`
        );

        return res.sendStatus(200);
      }

      console.error(
        "[PAYSTACK WEBHOOK ERROR]",
        error
      );

      return res.sendStatus(500);
    } finally {
      client.release();
    }
  };
