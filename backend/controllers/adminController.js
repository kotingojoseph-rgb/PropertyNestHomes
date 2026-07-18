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
