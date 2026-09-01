const crypto = require("crypto");
const pool = require("../config/db");

const {
  creditWallet,
  completeWithdrawal,
  releaseWithdrawal,
  reverseWithdrawal,
} = require("../services/walletService");

const {
  creditInvestorInvestmentAccount,
} = require("../services/investorInvestmentAccountService");

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
    throw new Error("Payment reference missing");
  }

  const existing = await client.query(
    `
    SELECT id
    FROM payments
    WHERE reference = $1
    FOR UPDATE
    `,
    [reference]
  );

  if (existing.rows.length > 0) {
    return {
      duplicate: true,
    };
  }

  const amount = Number(data.amount) / 100;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid payment amount");
  }

  const metadata = data.metadata || {};

  const userId = metadata.user_id || null;
  const propertyId = metadata.property_id || null;

  const paymentType =
    metadata.payment_type || "customer_payment";

  /*
   * Investment payment.
   *
   * Paystack sends investment payments through charge.success.
   * Process the investment here so the webhook can complete the
   * investment even when the frontend does not call /verify/:reference.
   */
  if (
    String(paymentType).toLowerCase() === "investment" &&
    metadata.investment_id
  ) {
    const investmentId = Number(metadata.investment_id);

    if (!Number.isInteger(investmentId) || investmentId <= 0) {
      throw new Error("Invalid investment ID in payment metadata");
    }

    const investmentResult = await client.query(
      `
      SELECT
        i.*,
        p.title AS property_title
      FROM investments i
      JOIN properties p
        ON p.id = i.property_id
      WHERE i.id = $1
      FOR UPDATE OF i
      `,
      [investmentId]
    );

    if (investmentResult.rows.length === 0) {
      throw new Error("Investment not found");
    }

    const investment = investmentResult.rows[0];

    /*
     * The Paystack reference MUST match the reference that was
     * created for this exact investment during initialization.
     *
     * This prevents another successful Paystack transaction from
     * being used to complete this investment.
     */
    if (
      !investment.payment_reference ||
      String(investment.payment_reference) !== String(reference)
    ) {
      throw new Error(
        "Payment reference does not match the investment"
      );
    }

    /*
     * The Paystack metadata must point to the same investor
     * and property stored in our database.
     */
    if (
      metadata.user_id &&
      Number(metadata.user_id) !== Number(investment.investor_id)
    ) {
      throw new Error(
        "Payment investor does not match the investment owner"
      );
    }

    if (
      metadata.property_id &&
      Number(metadata.property_id) !== Number(investment.property_id)
    ) {
      throw new Error(
        "Payment property does not match the investment"
      );
    }

    /*
     * An investment can only be funded once.
     */
    if (investment.status === "completed") {
      return {
        duplicate: true,
        investmentId: investment.id,
        alreadyCompleted: true,
      };
    }

    if (!["pending", "approved"].includes(investment.status)) {
      throw new Error(
        `Investment cannot be completed while its status is '${investment.status}'`
      );
    }

    const originalAmount = Number(investment.amount);
    const propertyAmount = Number(investment.property_amount);

    if (
      !Number.isFinite(originalAmount) ||
      originalAmount <= 0
    ) {
      throw new Error("Invalid investment amount");
    }

    if (
      !Number.isFinite(propertyAmount) ||
      propertyAmount <= 0
    ) {
      throw new Error("Invalid investment property amount");
    }

    /*
     * Paystack settlement for the current investment flow is NGN.
     */
    const paymentCurrency = String(
      data.currency ||
      metadata.payment_currency ||
      "NGN"
    ).toUpperCase();

    if (paymentCurrency !== "NGN") {
      throw new Error(
        `Unsupported Paystack investment currency: ${paymentCurrency}`
      );
    }

    const propertyCurrency = String(
      investment.property_currency ||
      "NGN"
    ).toUpperCase();

    const investorCurrency = String(
      investment.settlement_currency ||
      investment.currency ||
      "NGN"
    ).toUpperCase();

    /*
     * Calculate the exact amount that our initialization endpoint
     * told Paystack to charge.
     */
    let expectedChargedAmount;

    if (propertyCurrency === "NGN") {
      expectedChargedAmount = propertyAmount;
    } else if (investorCurrency === "NGN") {
      expectedChargedAmount = originalAmount;
    } else {
      throw new Error(
        "This investment requires an unsupported Paystack settlement conversion"
      );
    }

    /*
     * Never complete an investment for an unexpected Paystack amount.
     */
    if (
      Math.abs(amount - expectedChargedAmount) > 0.01
    ) {
      throw new Error(
        `Invalid investment payment amount: expected ${expectedChargedAmount}, received ${amount}`
      );
    }

    /*
     * Record the investment payment.
     *
     * The wallet receives the actual property/investment amount,
     * not an additional gateway fee.
     */
    const paymentResult = await client.query(
      `
      INSERT INTO payments
      (
        user_id,
        property_id,
        investment_id,
        amount,
        original_amount,
        charged_amount,
        currency,
        payment_currency,
        payment_type,
        status,
        reference,
        gateway,
        exchange_rate,
        exchange_rate_source,
        exchange_rate_at,
        wallet_posted
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
        'investment',
        'completed',
        $9,
        'paystack',
        $10,
        $11,
        $12,
        FALSE
      )
      RETURNING *
      `,
      [
        investment.investor_id,
        investment.property_id,
        investment.id,
        propertyAmount,
        originalAmount,
        amount,
        propertyCurrency,
        paymentCurrency,
        reference,
        investment.exchange_rate || null,
        investment.exchange_rate_source || null,
        investment.exchange_rate_at || null,
      ]
    );

    /*
     * Credit only the investment/property amount.
     */
    const investorAccountResult =
      await creditInvestorInvestmentAccount(client, {
        userId: investment.investor_id,
        amount: propertyAmount,
        currency: paymentCurrency,
        transactionType: "investment_funding",
        reference,
        sourceType: "payment",
        sourceId: String(paymentResult.rows[0].id),
        description:
          `Investment funding ${reference} for investment #${investment.id}`,
      });

    await client.query(
      `
      UPDATE payments
      SET
        investor_account_id = $1,
        investor_account_posted = TRUE,
        investor_account_transaction_id = $2
      WHERE id = $3
      `,
      [
        investorAccountResult.account.id,
        investorAccountResult.transaction.id,
        paymentResult.rows[0].id,
      ]
    );

    const completedInvestment = await client.query(
      `
      UPDATE investments
      SET
        status = 'completed',
        payment_provider = 'paystack',
        payment_reference = $1,
        completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [
        reference,
        investment.id,
      ]
    );

    return {
      duplicate: false,
      investmentId: investment.id,
      paymentId: paymentResult.rows[0].id,
      investorAccountTransactionId: investorAccountResult.transaction.id,
      investment: completedInvestment.rows[0],
    };
  }

  const plan = metadata.plan
    ? String(metadata.plan).toLowerCase()
    : null;

  const promotionPrices = {
    featured: 2000,
    premium: 5000,
    business: 10000,
  };

  /*
   * Promotion payments must have:
   * - a valid plan
   * - a property
   * - the exact server-defined price
   */
  if (paymentType === "promotion") {
    if (!userId || !propertyId || !plan) {
      throw new Error(
        "Invalid promotion payment metadata"
      );
    }

    const expectedAmount = promotionPrices[plan];

    if (!expectedAmount) {
      throw new Error(
        `Invalid promotion plan: ${plan}`
      );
    }

    if (amount !== expectedAmount) {
      throw new Error(
        `Invalid promotion amount for ${plan}: expected ${expectedAmount}, received ${amount}`
      );
    }

    /*
     * Verify that the property belongs to the
     * user who paid and has been verified.
     */
    const propertyResult = await client.query(
      `
      SELECT id, owner_id, verification_status
      FROM properties
      WHERE id = $1
      FOR UPDATE
      `,
      [propertyId]
    );

    if (propertyResult.rows.length === 0) {
      throw new Error("Promotion property not found");
    }

    const property = propertyResult.rows[0];

    if (Number(property.owner_id) !== Number(userId)) {
      throw new Error(
        "User does not own promotion property"
      );
    }

    if (property.verification_status !== "verified") {
      throw new Error(
        "Property must be verified before promotion"
      );
    }
  }

  /*
   * Record the successful Paystack payment.
   */
  const paymentResult = await client.query(
    `
    INSERT INTO payments
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
    RETURNING *
    `,
    [
      userId,
      propertyId,
      amount,
      paymentType,
      reference,
    ]
  );

  /*
   * Credit the platform wallet.
   */
  const walletResult = await creditWallet(client, {
    amount,
    transactionType: "payment",
    reference,
    sourceType: "payment",
    sourceId: String(
      paymentResult.rows[0].id
    ),
    description:
      `Paystack payment ${reference}`,
  });

  /*
   * Mark payment as posted to wallet.
   */
  await client.query(
    `
    UPDATE payments
    SET
      wallet_transaction_id = $1,
      wallet_posted = TRUE
    WHERE id = $2
    `,
    [
      walletResult.transaction.id,
      paymentResult.rows[0].id,
    ]
  );

  /*
   * If this is a promotion payment,
   * activate the promotion for 30 days.
   */
  if (paymentType === "promotion") {
    const promotionResult = await client.query(
      `
      INSERT INTO property_promotions
      (
        property_id,
        user_id,
        plan,
        amount,
        start_date,
        end_date,
        status,
        currency
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        'active',
        'NGN'
      )
      RETURNING *
      `,
      [
        propertyId,
        userId,
        plan,
        amount,
      ]
    );

    return {
      duplicate: false,
      paymentId:
        paymentResult.rows[0].id,
      promotionId:
        promotionResult.rows[0].id,
      promotion:
        promotionResult.rows[0],
      amount,
    };
  }

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
