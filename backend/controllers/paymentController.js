
const pool = require("../config/db");
const axios = require("axios");


// Initialize Paystack payment
exports.initializePayment = async (req, res) => {

  try {

    const {
      email,
      amount,
      user_id,
      property_id,
      payment_type
    } = req.body;


    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: Number(amount) * 100,
        metadata: {
          user_id,
          property_id,
          payment_type
        }
      },
      {
        headers: {
          Authorization:
            `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );


    res.json(response.data);


  } catch(error){

    res.status(500).json({
      error:error.message
    });

  }

};



// Verify Paystack payment
exports.verifyPayment = async (req,res)=>{

  const client = await pool.connect();

  try {

    const { reference } = req.params;


    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers:{
          Authorization:
          `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );


    const paymentData = response.data.data;


    if(paymentData.status !== "success"){

      return res.status(400).json({
        error:"Payment not successful"
      });

    }


    await client.query("BEGIN");


    const existing = await client.query(
      "SELECT id FROM payments WHERE reference=$1",
      [reference]
    );


    if(existing.rows.length > 0){

      await client.query("ROLLBACK");

      return res.json({
        message:"Payment already verified"
      });

    }



    const amount =
      paymentData.amount / 100;


    const metadata =
      paymentData.metadata;



    const payment = await client.query(
      `INSERT INTO payments
      (user_id,property_id,amount,payment_type,status,reference)
      VALUES($1,$2,$3,$4,'completed',$5)
      RETURNING *`,
      [
        metadata.user_id,
        metadata.property_id,
        amount,
        metadata.payment_type,
        reference
      ]
    );



    await client.query(
      `UPDATE admin_wallet
       SET balance = balance + $1,
       updated_at=CURRENT_TIMESTAMP
       WHERE id=1`,
      [amount]
    );



    await client.query("COMMIT");


    res.json({
      message:"Payment verified",
      payment:payment.rows[0]
    });



  }catch(error){

    await client.query("ROLLBACK");

    res.status(500).json({
      error:error.message
    });


  }finally{

    client.release();

  }

};



// Get payments
exports.getPayments = async(req,res)=>{

try{

const result = await pool.query(
"SELECT * FROM payments ORDER BY created_at DESC"
);

res.json(result.rows);


}catch(error){

res.status(500).json({
error:error.message
});

}

};



// Revenue summary
exports.getRevenue = async(req,res)=>{

try{

const result = await pool.query(
`SELECT 
COALESCE(SUM(amount),0) AS total_revenue,
COUNT(*) AS total_payments
FROM payments
WHERE status='completed'`
);


res.json(result.rows[0]);


}catch(error){

res.status(500).json({
error:error.message
});

}

};
