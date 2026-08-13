const pool = require("../config/db");

const {
  getWallet: getPlatformWallet,
  reserveForWithdrawal,
  releaseWithdrawal,
  getTransactions,
} = require("../services/walletService");

const axios = require("axios");

function paystackHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

/*
 * ============================================================
 * PLATFORM WALLET
 * ============================================================
 */

// Get platform wallet
exports.getWallet = async (req, res) => {
  try {
    const wallet = await getPlatformWallet();

    res.json(wallet);
  } catch (error) {
    console.error("Get platform wallet error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// Get platform wallet ledger
exports.getWalletTransactions = async (req, res) => {
  try {
    const {
      limit = 100,
      offset = 0,
    } = req.query;

    const transactions = await getTransactions(
      limit,
      offset
    );

    res.json(transactions);
  } catch (error) {
    console.error("Get wallet transactions error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
};

/*
 * ============================================================
 * PAYOUT ACCOUNTS
 * ============================================================
 */

// Resolve Nigerian bank account through Paystack
exports.resolveBankAccount = async (req, res) => {
  try {
    const {
      account_number,
      bank_code,
    } = req.query;

    if (!account_number || !bank_code) {
      return res.status(400).json({
        error: "account_number and bank_code are required",
      });
    }

    const response = await axios.get(
      "https://api.paystack.co/bank/resolve",
      {
        params: {
          account_number,
          bank_code,
        },
        headers: paystackHeaders(),
      }
    );

    return res.json({
      status: true,
      account_number:
        response.data.data.account_number,
      account_name:
        response.data.data.account_name,
      bank_code,
    });
  } catch (error) {
    console.error(
      "Bank account resolution error:",
      error.response?.data || error.message
    );

    return res.status(400).json({
      error:
        error.response?.data?.message ||
        "Unable to verify bank account",
    });
  }
};

// Save a verified payout account
exports.createPayoutAccount = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      bank_code,
      bank_name,
      account_number,
      account_name,
      is_default = false,
    } = req.body;

    if (
      !bank_code ||
      !bank_name ||
      !account_number ||
      !account_name
    ) {
      return res.status(400).json({
        error:
          "bank_code, bank_name, account_number and account_name are required",
      });
    }

    await client.query("BEGIN");

    /*
     * Ask Paystack to create a transfer recipient.
     * This gives us a recipient_code that can be reused
     * for future withdrawals.
     */
    const recipientResponse = await axios.post(
      "https://api.paystack.co/transferrecipient",
      {
        type: "nuban",
        name: account_name,
        account_number,
        bank_code,
        currency: "NGN",
      },
      {
        headers: paystackHeaders(),
      }
    );

    const recipient =
      recipientResponse.data.data;

    if (!recipient.recipient_code) {
      throw new Error(
        "Paystack did not return a recipient code"
      );
    }

    if (is_default) {
      await client.query(
        `UPDATE payout_accounts
         SET is_default = FALSE,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1`,
        [req.user.id]
      );
    }

    const result = await client.query(
      `INSERT INTO payout_accounts
       (
         user_id,
         provider,
         bank_code,
         bank_name,
         account_number,
         account_name,
         recipient_code,
         currency,
         is_verified,
         is_default
       )
       VALUES
       ($1,'paystack',$2,$3,$4,$5,$6,'NGN',TRUE,$7)
       RETURNING
         id,
         user_id,
         provider,
         bank_code,
         bank_name,
         account_number,
         account_name,
         recipient_code,
         currency,
         is_verified,
         is_default,
         created_at,
         updated_at`,
      [
        req.user.id,
        bank_code,
        bank_name,
        account_number,
        account_name,
        recipient.recipient_code,
        is_default,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Payout account verified and saved",
      payout_account: result.rows[0],
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    console.error(
      "Create payout account error:",
      error.response?.data || error.message
    );

    return res.status(400).json({
      error:
        error.response?.data?.message ||
        error.message ||
        "Unable to create payout account",
    });
  } finally {
    client.release();
  }
};

// Get admin payout accounts
exports.getPayoutAccounts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         user_id,
         provider,
         bank_code,
         bank_name,
         account_number,
         account_name,
         currency,
         is_verified,
         is_default,
         created_at,
         updated_at
       FROM payout_accounts
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(
      "Get payout accounts error:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
};

/*
 * ============================================================
 * WITHDRAWAL
 * ============================================================
 */

// Create a withdrawal request and initiate the Paystack transfer.
//
// The wallet reservation and withdrawal record are created inside
// one database transaction. The Paystack transfer is initiated before
// committing so a fast transfer webhook cannot observe an incomplete
// withdrawal record.
exports.createWithdrawal = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      amount,
      payout_account_id,
    } = req.body;

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        error: "A valid withdrawal amount is required",
      });
    }

    if (!payout_account_id) {
      return res.status(400).json({
        error: "payout_account_id is required",
      });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        error: "Paystack secret key is not configured",
      });
    }

    await client.query("BEGIN");

    // Lock and verify the admin's payout account.
    const payoutAccount = await client.query(
      `SELECT *
       FROM payout_accounts
       WHERE id = $1
       AND user_id = $2
       AND is_verified = TRUE
       AND provider = 'paystack'
       AND currency = 'NGN'
       FOR UPDATE`,
      [
        payout_account_id,
        req.user.id,
      ]
    );

    if (payoutAccount.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Verified Paystack payout account not found",
      });
    }

    const account = payoutAccount.rows[0];

    if (!account.recipient_code) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Payout account does not have a Paystack recipient code",
      });
    }

    // Paystack transfer references must be unique.
    const reference =
      `PNH-WD-${Date.now()}-${Math.floor(
        Math.random() * 1000000
      )}`;

    /*
     * Reserve the money before sending it to Paystack.
     */
    const walletResult =
      await reserveForWithdrawal(
        client,
        numericAmount,
        reference,
        `Withdrawal request ${reference}`
      );

    /*
     * Create the internal withdrawal record first.
     */
    const withdrawal = await client.query(
      `INSERT INTO withdrawal_requests
       (
         wallet_id,
         payout_account_id,
         amount,
         fee,
         net_amount,
         currency,
         status,
         provider,
         provider_reference
       )
       VALUES
       (1,$1,$2,0,$2,'NGN','processing','paystack',$3)
       RETURNING *`,
      [
        account.id,
        numericAmount,
        reference,
      ]
    );

    const withdrawalId =
      withdrawal.rows[0].id;

    /*
     * Initiate the actual Paystack transfer.
     *
     * Paystack expects the amount in the smallest currency unit.
     */
    let transferResponse;

    try {
      transferResponse = await axios.post(
        "https://api.paystack.co/transfer",
        {
          source: "balance",
          amount: Math.round(numericAmount * 100),
          recipient: account.recipient_code,
          reason: `PropertyNestHomes withdrawal ${reference}`,
          reference,
        },
        {
          headers: paystackHeaders(),
        }
      );
    } catch (transferError) {
      /*
       * The database transaction is still open, so rolling back here
       * also removes the reservation and withdrawal record atomically.
       */
      throw new Error(
        transferError.response?.data?.message ||
        transferError.message ||
        "Paystack transfer initiation failed"
      );
    }

    const transferData =
      transferResponse.data?.data;

    if (!transferResponse.data?.status || !transferData) {
      throw new Error(
        transferResponse.data?.message ||
        "Paystack did not return transfer data"
      );
    }

    const transferCode =
      transferData.transfer_code || null;

    const transferStatus =
      transferData.status || "pending";

    /*
     * Store Paystack's transfer code and current state.
     */
    const updatedWithdrawal = await client.query(
      `UPDATE withdrawal_requests
       SET
         status = $1,
         provider_transfer_code = $2,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [
        transferStatus === "success"
          ? "processing"
          : transferStatus === "failed"
            ? "failed"
            : "processing",
        transferCode,
        withdrawalId,
      ]
    );

    /*
     * If Paystack immediately reports failure, release the reservation
     * before committing the transaction.
     */
    if (transferStatus === "failed") {
      await releaseWithdrawal(
        client,
        numericAmount,
        reference,
        `Paystack transfer failed: ${
          transferData.reason || "Unknown transfer failure"
        }`
      );

      await client.query(
        `UPDATE withdrawal_requests
         SET
           status = 'failed',
           failure_reason = $1,
           processed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [
          transferData.reason ||
            "Paystack transfer failed",
          withdrawalId,
        ]
      );

      await client.query("COMMIT");

      return res.status(400).json({
        error:
          "Paystack transfer failed",
        withdrawal:
          updatedWithdrawal.rows[0],
        wallet:
          (await getPlatformWallet(client)),
      });
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message:
        "Withdrawal created and Paystack transfer initiated",
      withdrawal:
        updatedWithdrawal.rows[0],
      wallet:
        walletResult.wallet,
      transfer: {
        reference,
        transfer_code:
          transferCode,
        status:
          transferStatus,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    console.error(
      "Create withdrawal error:",
      error.response?.data ||
        error.message ||
        error
    );

    return res.status(400).json({
      error:
        error.response?.data?.message ||
        error.message ||
        "Unable to create withdrawal",
    });
  } finally {
    client.release();
  }
};

// Get withdrawal history
exports.getWithdrawals = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         wr.*,
         pa.bank_name,
         pa.account_number,
         pa.account_name
       FROM withdrawal_requests wr
       LEFT JOIN payout_accounts pa
         ON pa.id = wr.payout_account_id
       WHERE wr.wallet_id = 1
       ORDER BY wr.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(
      "Get withdrawals error:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
};

// Get pending properties for verification
exports.getPendingProperties = async (req, res) => {
  try {

    const result = await pool.query(
      `SELECT *
       FROM properties
       WHERE verification_status = 'pending'
       ORDER BY created_at DESC`
    );

    res.json(result.rows);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};


// Approve property
exports.approveProperty = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the property
    const propertyResult = await pool.query(
      `SELECT *
       FROM properties
       WHERE id = $1`,
      [id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }

    const existingProperty = propertyResult.rows[0];

    // Prevent duplicate approval
    if (existingProperty.verification_status === "verified") {
      return res.status(400).json({
        message: "Property already approved",
        property: existingProperty
      });
    }

    // A property registration certificate must actually be uploaded.
    // Do NOT require property_registration_id here because that column
    // is not the uploaded document itself.
    const documentResult = await pool.query(
      `SELECT *
       FROM property_documents
       WHERE property_id = $1
         AND document_type = 'Property Registration Certificate'
       ORDER BY uploaded_at DESC
       LIMIT 1`,
      [id]
    );

    if (documentResult.rows.length === 0) {
      return res.status(400).json({
        message: "Property Registration Certificate must be uploaded before approval"
      });
    }

    const registrationDocument = documentResult.rows[0];

    // Generate the official PropertyNestHomes listing ID
    const year = new Date().getFullYear();

    const sequenceResult = await pool.query(
      `SELECT nextval('propertynest_id_sequence')`
    );

    const nextNumber = sequenceResult.rows[0].nextval;

    const propertyNestId =
      `PNH-${year}-${String(nextNumber).padStart(6, "0")}`;

    // Approve the property
    const result = await pool.query(
      `UPDATE properties
       SET
         verification_status = 'verified',
         status = 'Available',
         propertynest_id = $1,
         verified_at = CURRENT_TIMESTAMP,
         verified_by = $2,
         verification_notes = NULL
       WHERE id = $3
       RETURNING *`,
      [
        propertyNestId,
        req.user.id,
        id
      ]
    );

    // Mark the registration certificate as verified
    await pool.query(
      `UPDATE property_documents
       SET verification_status = 'verified'
       WHERE id = $1`,
      [registrationDocument.id]
    );

    // Record the approval action
    await pool.query(
      `INSERT INTO property_verification_logs
       (property_id, admin_id, action, notes)
       VALUES ($1, $2, $3, $4)`,
      [
        id,
        req.user.id,
        "APPROVED",
        "Property registration certificate reviewed and property approved"
      ]
    );

    res.json({
      message: "Property approved successfully",
      property: result.rows[0],
      registration_document: {
        id: registrationDocument.id,
        document_type: registrationDocument.document_type,
        document_name: registrationDocument.document_name
      }
    });

  } catch (error) {
    console.error("approveProperty error:", error);

    res.status(500).json({
      error: error.message
    });
  }
};


// Reject property
exports.rejectProperty = async (req, res) => {
  try {

    const { id } = req.params;

    const { reason } = req.body;


    const result = await pool.query(
      `UPDATE properties
       SET
       verification_status = 'rejected',
       verification_notes = $1
       WHERE id = $2
       RETURNING *`,
      [
        reason || "Property rejected during verification",
        id
      ]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }


    res.json({
      message: "Property rejected",
      property: result.rows[0]
    });


  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};

    
