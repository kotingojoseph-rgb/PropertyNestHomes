const axios = require("axios");
const pool = require("../config/db");
const { creditWallet } = require("../services/walletService");

const PROMOTION_PLANS = {
  featured: 2000,
  premium: 5000,
  business: 10000,
};

function paystackHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

// Initialize Paystack payment
exports.initializePayment = async (req, res) => {
  try {
    const { email, property_id, plan } = req.body;

    const userId = req.user.id;

    if (!email || !property_id || !plan) {
      return res.status(400).json({
        error: "Email, property and plan are required",
      });
    }

    const normalizedPlan = String(plan).toLowerCase();

    if (!PROMOTION_PLANS[normalizedPlan]) {
      return res.status(400).json({
        error: "Invalid promotion plan",
      });
    }

    const propertyResult = await pool.query(
      `
      SELECT id, owner_id, verification_status
      FROM properties
      WHERE id = $1
      `,
      [property_id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        error: "Property not found",
      });
    }

    const property = propertyResult.rows[0];

    if (property.owner_id !== userId) {
      return res.status(403).json({
        error: "You can only promote your own property",
      });
    }

    if (property.verification_status !== "verified") {
      return res.status(400).json({
        error: "Property must be verified before promotion",
      });
    }

    const amount = PROMOTION_PLANS[normalizedPlan];

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100,

        metadata: {
          user_id: userId,
          property_id: property_id,
          payment_type: "promotion",
          plan: normalizedPlan,
          promotion_amount: amount,
        },
      },
      {
        headers: paystackHeaders(),
      }
    );

    return res.json(response.data);
  } catch (error) {
    console.error(
      "Paystack initialization error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      error:
        error.response?.data?.message ||
        "Unable to initialize payment",
    });
  }
};


// Initialize Paystack payment for an investment
exports.initializeInvestmentPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const investorId = req.user.id;
    const { investment_id } = req.body;

    if (!investment_id) {
      return res.status(400).json({
        error: "Investment ID is required.",
      });
    }

    /*
     * Get the authenticated investor's email directly from
     * the database. Never trust a payment email supplied by
     * the browser.
     */
    const investorResult = await client.query(
      `
      SELECT id, email
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [investorId]
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).json({
        error: "Investor account not found.",
      });
    }

    const investorEmail = String(
      investorResult.rows[0].email || ""
    ).trim();

    if (!investorEmail) {
      return res.status(400).json({
        error: "Your account does not have a valid email address.",
      });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT
        i.*,
        p.title AS property_title
      FROM investments i
      JOIN properties p
        ON p.id = i.property_id
      WHERE i.id = $1
        AND i.investor_id = $2
      FOR UPDATE OF i
      `,
      [investment_id, investorId]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Investment not found.",
      });
    }

    const investment = result.rows[0];

    if (!["pending", "approved"].includes(investment.status)) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: `Investment cannot be paid while its status is '${investment.status}'.`,
      });
    }

    if (investment.payment_reference) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "A payment has already been initialized for this investment.",
        payment_reference: investment.payment_reference,
      });
    }

    const originalAmount = Number(investment.amount);
    const propertyAmount = Number(investment.property_amount);
    const investorCurrency = String(
      investment.settlement_currency ||
      investment.currency ||
      "NGN"
    ).toUpperCase();

    const propertyCurrency = String(
      investment.property_currency || "NGN"
    ).toUpperCase();

    if (!Number.isFinite(originalAmount) || originalAmount <= 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Invalid investment amount.",
      });
    }

    if (!Number.isFinite(propertyAmount) || propertyAmount <= 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Investment conversion amount is invalid.",
      });
    }

    /*
     * Paystack's transaction amount is sent in the smallest
     * unit of the currency being charged.
     *
     * For Nigerian Paystack accounts, we charge NGN.
     *
     * Example:
     * USD 1,000 investment
     * -> stored property amount NGN 1,339,958.53
     * -> Paystack charge NGN 1,339,958.53
     */
    const paymentCurrency = "NGN";
    let chargedAmount;

    if (propertyCurrency === "NGN") {
      chargedAmount = propertyAmount;
    } else if (investorCurrency === "NGN") {
      chargedAmount = originalAmount;
    } else {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error:
          "This investment requires a currency conversion that is not currently supported for Paystack settlement.",
        investor_currency: investorCurrency,
        property_currency: propertyCurrency,
      });
    }

    if (!Number.isFinite(chargedAmount) || chargedAmount <= 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Invalid Paystack charge amount.",
      });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: investorEmail,
        amount: Math.round(chargedAmount * 100),
        currency: paymentCurrency,

        metadata: {
          user_id: investorId,
          investment_id: investment.id,
          property_id: investment.property_id,
          payment_type: "investment",
          investor_currency: investorCurrency,
          investor_amount: originalAmount,
          property_currency: propertyCurrency,
          property_amount: propertyAmount,
          exchange_rate: investment.exchange_rate,
          exchange_rate_source: investment.exchange_rate_source,
          exchange_rate_at: investment.exchange_rate_at,
        },
      },
      {
        headers: paystackHeaders(),
      }
    );

    const paystackData = response.data?.data;

    if (!paystackData?.reference) {
      throw new Error("Paystack did not return a payment reference.");
    }

    await client.query(
      `
      UPDATE investments
      SET
        payment_provider = 'paystack',
        payment_reference = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [paystackData.reference, investment.id]
    );

    await client.query("COMMIT");

    return res.json({
      message: "Investment payment initialized successfully.",
      investment_id: investment.id,
      reference: paystackData.reference,
      authorization_url: paystackData.authorization_url,
      access_code: paystackData.access_code,
      payment: {
        original_amount: originalAmount,
        investor_currency: investorCurrency,
        charged_amount: chargedAmount,
        payment_currency: paymentCurrency,
        property_amount: propertyAmount,
        property_currency: propertyCurrency,
        exchange_rate: investment.exchange_rate,
        exchange_rate_source: investment.exchange_rate_source,
        exchange_rate_at: investment.exchange_rate_at,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    console.error(
      "Investment payment initialization error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      error:
        error.response?.data?.message ||
        error.message ||
        "Unable to initialize investment payment.",
    });
  } finally {
    client.release();
  }
};


// Verify Paystack payment
exports.verifyPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        error: "Payment reference is required",
      });
    }

    /*
     * Ask Paystack for the authoritative transaction status.
     */
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        reference
      )}`,
      {
        headers: paystackHeaders(),
      }
    );

    const paymentData = response.data?.data;

    if (!paymentData) {
      return res.status(400).json({
        error: "Paystack returned no transaction data.",
      });
    }

    if (paymentData.status !== "success") {
      return res.status(400).json({
        error: "Payment not successful",
        status: paymentData.status,
      });
    }

    const chargedAmount = Number(paymentData.amount) / 100;
    const metadata = paymentData.metadata || {};

    if (!Number.isFinite(chargedAmount) || chargedAmount <= 0) {
      return res.status(400).json({
        error: "Invalid payment amount",
      });
    }

    const paymentType = String(
      metadata.payment_type || "customer_payment"
    ).toLowerCase();

    const investmentId = metadata.investment_id
      ? Number(metadata.investment_id)
      : null;

    const userId = metadata.user_id
      ? Number(metadata.user_id)
      : null;

    const propertyId = metadata.property_id
      ? Number(metadata.property_id)
      : null;

    /*
     * Investment payment.
     *
     * The amount actually charged by Paystack can be higher than
     * the investment/property amount because Paystack fees are
     * included in the checkout charge.
     */
    if (paymentType === "investment" && investmentId) {
      await client.query("BEGIN");

      /*
       * Lock the investment so two simultaneous verification
       * requests cannot complete it twice.
       */
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
        await client.query("ROLLBACK");

        return res.status(404).json({
          error: "Investment not found.",
        });
      }

      const investment = investmentResult.rows[0];

      /*
       * Verify the Paystack metadata belongs to the same investor.
       */
      if (
        userId !== null &&
        Number(investment.investor_id) !== userId
      ) {
        await client.query("ROLLBACK");

        return res.status(403).json({
          error: "Payment investor does not match the investment owner.",
        });
      }

      /*
       * Verify the property also matches.
       */
      if (
        propertyId !== null &&
        Number(investment.property_id) !== propertyId
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          error: "Payment property does not match the investment.",
        });
      }

      /*
       * If this investment was already completed, check whether
       * this exact payment was already recorded.
       */
      const existingReference = await client.query(
        `
        SELECT id, investment_id, status
        FROM payments
        WHERE reference = $1
        FOR UPDATE
        `,
        [reference]
      );

      if (existingReference.rows.length > 0) {
        await client.query("ROLLBACK");

        return res.json({
          message: "Payment already verified",
          payment_id: existingReference.rows[0].id,
          investment_id: existingReference.rows[0].investment_id,
          status: existingReference.rows[0].status,
        });
      }

      /*
       * If the investment already has a different completed payment,
       * do not allow another payment to fund it.
       */
      if (investment.status === "completed") {
        const completedPayment = await client.query(
          `
          SELECT id, reference
          FROM payments
          WHERE investment_id = $1
            AND status = 'completed'
          ORDER BY id DESC
          LIMIT 1
          `,
          [investmentId]
        );

        await client.query("ROLLBACK");

        return res.status(409).json({
          error: "This investment has already been paid.",
          payment_id: completedPayment.rows[0]?.id || null,
          payment_reference:
            completedPayment.rows[0]?.reference || null,
        });
      }

      /*
       * Only pending/approved investments may be completed.
       */
      if (!["pending", "approved"].includes(investment.status)) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          error: `Investment cannot be completed while its status is '${investment.status}'.`,
        });
      }

      const originalAmount = Number(investment.amount);
      const propertyAmount = Number(investment.property_amount);

      if (!Number.isFinite(originalAmount) || originalAmount <= 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          error: "Invalid investment amount.",
        });
      }

      if (!Number.isFinite(propertyAmount) || propertyAmount <= 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          error: "Invalid investment property amount.",
        });
      }

      const paymentCurrency = String(
        paymentData.currency ||
        metadata.payment_currency ||
        investment.property_currency ||
        "NGN"
      ).toUpperCase();

      const investorCurrency = String(
        metadata.investor_currency ||
        investment.settlement_currency ||
        investment.currency ||
        "NGN"
      ).toUpperCase();

      /*
       * The amount credited to the PropertyNestHomes wallet should
       * be the investment/property amount, NOT the gross Paystack
       * checkout amount.
       *
       * Example:
       *
       * Investment:     ₦1,339,958.53
       * Paystack gross: ₦1,341,958.53
       * Paystack fee:   ₦2,000
       *
       * Wallet credit:  ₦1,339,958.53
       */
      const investmentWalletAmount = Number(
        propertyAmount.toFixed(2)
      );

      /*
       * Store the payment with the complete currency/conversion
       * information.
       */
      const payment = await client.query(
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
          $9,
          'completed',
          $10,
          'paystack',
          $11,
          $12,
          $13,
          FALSE
        )
        RETURNING *
        `,
        [
          userId || investment.investor_id,
          propertyId || investment.property_id,
          investment.id,
          investmentWalletAmount,
          originalAmount,
          chargedAmount,
          paymentCurrency,
          paymentCurrency,
          "investment",
          reference,
          investment.exchange_rate || null,
          investment.exchange_rate_source || null,
          investment.exchange_rate_at || null,
        ]
      );

      /*
       * Credit only the actual investment/property amount.
       */
      const walletResult = await creditWallet(client, {
        amount: investmentWalletAmount,
        transactionType: "payment",
        reference,
        sourceType: "payment",
        sourceId: String(payment.rows[0].id),
        description:
          `Investment payment ${reference} for investment #${investment.id}`,
      });

      /*
       * Mark the payment as posted to the wallet.
       */
      const updatedPayment = await client.query(
        `
        UPDATE payments
        SET
          wallet_posted = TRUE,
          wallet_transaction_id = $1
        WHERE id = $2
        RETURNING *
        `,
        [
          walletResult.transaction.id,
          payment.rows[0].id,
        ]
      );

      /*
       * Mark the investment as completed.
       */
      const completedInvestment = await client.query(
        `
        UPDATE investments
        SET
          status = 'completed',
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
        `,
        [investment.id]
      );

      await client.query("COMMIT");

      return res.json({
        message:
          "Investment payment verified, investment completed, and wallet credited.",
        payment: updatedPayment.rows[0],
        investment: completedInvestment.rows[0],
        wallet: walletResult.wallet,
        payment_breakdown: {
          investment_amount: investmentWalletAmount,
          charged_amount: chargedAmount,
          paystack_fee: Number(
            (chargedAmount - investmentWalletAmount).toFixed(2)
          ),
          payment_currency: paymentCurrency,
          investor_currency: investorCurrency,
          exchange_rate: investment.exchange_rate,
          exchange_rate_source:
            investment.exchange_rate_source,
          exchange_rate_at: investment.exchange_rate_at,
        },
      });
    }

    /*
     * Generic/non-investment payment.
     *
     * Keep the existing wallet behavior for promotions and
     * other future payment types.
     */
    await client.query("BEGIN");

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
      await client.query("ROLLBACK");

      return res.json({
        message: "Payment already verified",
        payment_id: existing.rows[0].id,
      });
    }

    const payment = await client.query(
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
      ($1,$2,$3,$4,'completed',$5,'NGN','paystack',FALSE)
      RETURNING *
      `,
      [
        userId,
        propertyId,
        chargedAmount,
        paymentType,
        reference,
      ]
    );

    const walletResult = await creditWallet(client, {
      amount: chargedAmount,
      transactionType: "payment",
      reference,
      sourceType: "payment",
      sourceId: String(payment.rows[0].id),
      description: `Paystack payment ${reference}`,
    });

    const updatedPayment = await client.query(
      `
      UPDATE payments
      SET
        wallet_posted = TRUE,
        wallet_transaction_id = $1
      WHERE id = $2
      RETURNING *
      `,
      [
        walletResult.transaction.id,
        payment.rows[0].id,
      ]
    );

    await client.query("COMMIT");

    return res.json({
      message: "Payment verified and wallet credited",
      payment: updatedPayment.rows[0],
      wallet: walletResult.wallet,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    console.error(
      "Payment verification error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      error:
        error.response?.data?.message ||
        error.message ||
        "Payment verification failed",
    });
  } finally {
    client.release();
  }
};


// Get payment history
exports.getPayments = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM payments
      ORDER BY created_at DESC
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Get payments error:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};


// Revenue summary
exports.getRevenue = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        COALESCE(SUM(amount), 0) AS total_revenue,
        COUNT(*) AS total_payments
      FROM payments
      WHERE status = 'completed'
      `
    );

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Revenue error:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};
