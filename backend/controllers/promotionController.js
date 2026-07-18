const pool = require("../config/db");


// Create featured property promotion
exports.createPromotion = async (req, res) => {
  try {

    const {
      property_id,
      user_id,
      plan,
      amount,
      start_date,
      end_date
    } = req.body;


    const result = await pool.query(
      `INSERT INTO property_promotions
      (property_id,user_id,plan,amount,start_date,end_date)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        property_id,
        user_id,
        plan,
        amount,
        start_date,
        end_date
      ]
    );


    res.status(201).json(result.rows[0]);


  } catch(error){

    res.status(500).json({
      error:error.message
    });

  }
};


// Get promotions
exports.getPromotions = async (req,res)=>{
  try{

    const result = await pool.query(
      `SELECT * FROM property_promotions
       ORDER BY created_at DESC`
    );


    res.json(result.rows);


  }catch(error){

    res.status(500).json({
      error:error.message
    });

  }
};
