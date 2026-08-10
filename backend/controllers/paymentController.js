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

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        reference
      )}`,
      {
        headers: paystackHeaders(),
      }
    );

    const paymentData = response.data.data;

    if (paymentData.status !== "success") {
      return res.status(400).json({
        error: "Payment not successful",
        status: paymentData.status,
      });
    }

    const amount = Number(paymentData.amount) / 100;
    const metadata = paymentData.metadata || {};

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        error: "Invalid payment amount",
      });
    }

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
        metadata.user_id || null,
        metadata.property_id || null,
        amount,
        metadata.payment_type || "customer_payment",
        reference,
      ]
    );

    const walletResult = await creditWallet(client, {
      amount,
      transactionType: "payment",
      reference,
      sourceType: "payment",
      sourceId: String(payment.rows[0].id),
      description: `Paystack payment ${reference}`,
    });

    await client.query(
      `
      UPDATE payments
      SET
        wallet_posted = TRUE,
        wallet_transaction_id = $1
      WHERE id = $2
      `,
      [
        walletResult.transaction.id,
        payment.rows[0].id,
      ]
    );

    await client.query("COMMIT");

    return res.json({
      message: "Payment verified and wallet credited",
      payment: payment.rows[0],
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
