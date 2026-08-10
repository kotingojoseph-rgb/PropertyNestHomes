const pool = require("../config/db");

const PROMOTION_PLANS = {
  featured: 2000,
  premium: 5000,
  business: 10000,
};

// Create a promotion
// This endpoint is for internal/admin use.
// Paid users should normally reach this through Paystack confirmation.
exports.createPromotion = async (req, res) => {
  try {
    const {
      property_id,
      plan,
      start_date,
      end_date,
    } = req.body;

    const user_id = req.user.id;

    if (!property_id || !plan) {
      return res.status(400).json({
        error: "Property and plan are required",
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

    if (property.owner_id !== user_id) {
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

    const result = await pool.query(
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
      ($1,$2,$3,$4,
       COALESCE($5::date, CURRENT_DATE),
       COALESCE($6::date, CURRENT_DATE + INTERVAL '30 days'),
       'active',
       'NGN')
      RETURNING *
      `,
      [
        property_id,
        user_id,
        normalizedPlan,
        amount,
        start_date || null,
        end_date || null,
      ]
    );

    return res.status(201).json({
      message: "Promotion created",
      promotion: result.rows[0],
    });
  } catch (error) {
    console.error("Create promotion error:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};


// Get promotions
exports.getPromotions = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM property_promotions
      WHERE status = 'active'
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
      ORDER BY created_at DESC
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Get promotions error:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};
