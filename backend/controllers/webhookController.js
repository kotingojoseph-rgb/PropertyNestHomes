const crypto = require("crypto");
const pool = require("../config/db");

exports.paystackWebhook = async (req, res) => {
  try {

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");


    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({
        error: "Invalid signature"
      });
    }


    const event = req.body;


    if (event.event === "charge.success") {

      const data = event.data;

      const reference = data.reference;


      const existing = await pool.query(
        "SELECT id FROM payments WHERE reference=$1",
        [reference]
      );


      if (existing.rows.length > 0) {
        return res.sendStatus(200);
      }


      const amount = data.amount / 100;

      const metadata = data.metadata;


      await pool.query(
        `INSERT INTO payments
        (user_id, property_id, amount, payment_type, status, reference)
        VALUES($1,$2,$3,$4,'completed',$5)`,
        [
          metadata.user_id,
          metadata.property_id,
          amount,
          metadata.payment_type,
          reference
        ]
      );


      await pool.query(
        `UPDATE admin_wallet
         SET balance = balance + $1,
         updated_at=CURRENT_TIMESTAMP
         WHERE id=1`,
        [amount]
      );

    }


    res.sendStatus(200);


  } catch(error){

    console.error(error);

    res.sendStatus(500);

  }
};
