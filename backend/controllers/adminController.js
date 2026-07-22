const pool = require("../config/db");


// Get admin wallet balance
exports.getWallet = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM admin_wallet LIMIT 1"
    );

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


// Request withdrawal
exports.createWithdrawal = async (req, res) => {

  const client = await pool.connect();

  try {

    const {
      amount,
      bank_name,
      account_number,
      account_name
    } = req.body;


    await client.query("BEGIN");


    const wallet = await client.query(
      "SELECT balance FROM admin_wallet WHERE id = 1 FOR UPDATE"
    );


    const balance = Number(wallet.rows[0].balance);


    if (amount > balance) {

      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Insufficient wallet balance"
      });

    }


    const withdrawal = await client.query(
      `INSERT INTO withdrawals
      (amount, bank_name, account_number, account_name)
      VALUES($1,$2,$3,$4)
      RETURNING *`,
      [
        amount,
        bank_name,
        account_number,
        account_name
      ]
    );


    await client.query(
      `UPDATE admin_wallet
       SET balance = balance - $1,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`,
      [amount]
    );


    await client.query("COMMIT");


    res.status(201).json({
      message: "Withdrawal request created",
      withdrawal: withdrawal.rows[0]
    });


  } catch(error) {

    await client.query("ROLLBACK");

    res.status(500).json({
      error:error.message
    });


  } finally {

    client.release();

  }

};


// Get withdrawal history
exports.getWithdrawals = async (req,res)=>{
  try{

    const result = await pool.query(
      `SELECT * FROM withdrawals
       ORDER BY created_at DESC`
    );


    res.json(result.rows);


  }catch(error){

    res.status(500).json({
      error:error.message
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

    const property = await pool.query(
      `SELECT *
       FROM properties
       WHERE id = $1`,
      [id]
    );

    if (property.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }

    const existingProperty = property.rows[0];

    if (!existingProperty.property_registration_id) {
      return res.status(400).json({
        message: "Property registration document required before approval"
      });
    }

    if (existingProperty.verification_status === "verified") {
      return res.status(400).json({
        message: "Property already approved"
      });
    }

    const year = new Date().getFullYear();

    const sequenceResult = await pool.query(
      `SELECT nextval('propertynest_id_sequence')`
    );

    const nextNumber =
      sequenceResult.rows[0].nextval;

    const propertyNestId =
      `PNH-${year}-${String(nextNumber).padStart(6, "0")}`;

    const result = await pool.query(
      `UPDATE properties
       SET
       verification_status = 'verified',
       propertynest_id = $1,
       verified_at = CURRENT_TIMESTAMP,
       verified_by = $2
       WHERE id = $3
       RETURNING *`,
      [
        propertyNestId,
        req.user.id,
        id
      ]
    );

    res.json({
      message: "Property approved successfully",
      property: result.rows[0]
    });

  } catch (error) {

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

    
