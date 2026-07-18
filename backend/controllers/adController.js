const pool = require("../config/db");

exports.createAd = async (req, res) => {
  try {
    const {
      title,
      image_url,
      company_name,
      target_url,
      start_date,
      end_date
    } = req.body;

    const result = await pool.query(
      `INSERT INTO advertisements
      (title,image_url,company_name,target_url,start_date,end_date)
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [
        title,
        image_url,
        company_name,
        target_url,
        start_date,
        end_date
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getAds = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM advertisements 
       WHERE status='approved'
       ORDER BY created_at DESC`
    );

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
