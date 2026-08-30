const pool = require("../config/db");

const {
  normalizeCurrency,
  isSupportedCurrency,
  convertCurrency,
} = require("../services/currencyService");


/*
 * Create an investment request
 *
 * POST /api/investments
 *
 * amount:
 *   Amount the investor wants to invest in their selected currency.
 *
 * currency:
 *   Investor settlement currency.
 *
 * property_currency:
 *   Currency of the property/listing.
 *
 * The database stores both currencies and the exchange rate used.
 */
const createInvestment = async (req, res) => {
  const client = await pool.connect();

  try {
    const investorId = req.user.id;

    const {
      property_id,
      amount,
      currency,
      notes,
    } = req.body;

    if (!property_id || amount === undefined || amount === null) {
      return res.status(400).json({
        error: "Property and investment amount are required.",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        error: "Investment amount must be greater than zero.",
      });
    }

    const settlementCurrency = normalizeCurrency(currency || "NGN");

    if (!isSupportedCurrency(settlementCurrency)) {
      return res.status(400).json({
        error: `Unsupported investment currency: ${settlementCurrency}.`,
      });
    }

    await client.query("BEGIN");

    const propertyResult = await client.query(
      `
      SELECT
        id,
        title,
        price,
        currency,
        owner_id,
        verification_status
      FROM properties
      WHERE id = $1
      FOR UPDATE
      `,
      [property_id]
    );

    if (propertyResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Property not found.",
      });
    }

    const property = propertyResult.rows[0];

    if (property.verification_status !== "verified") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "Only verified properties can receive investment requests.",
      });
    }

    if (Number(property.owner_id) === Number(investorId)) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "You cannot invest in your own property.",
      });
    }

    const propertyCurrency = normalizeCurrency(
      property.currency || "NGN"
    );

    if (!isSupportedCurrency(propertyCurrency)) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: `The property uses unsupported currency ${propertyCurrency}.`,
      });
    }

    /*
     * Prevent duplicate pending requests for the same property.
     */
    const existing = await client.query(
      `
      SELECT id
      FROM investments
      WHERE investor_id = $1
        AND property_id = $2
        AND status = 'pending'
      LIMIT 1
      `,
      [investorId, property_id]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error:
          "You already have a pending investment request for this property.",
        investment_id: existing.rows[0].id,
      });
    }

    /*
     * Convert investor's selected currency into the
     * property's listing currency.
     *
     * Example:
     * USD 10,000 -> NGN equivalent.
     */
    const conversion = await convertCurrency(
      numericAmount,
      settlementCurrency,
      propertyCurrency
    );

    const propertyAmount = Number(
      conversion.convertedAmount.toFixed(2)
    );

    const result = await client.query(
      `
      INSERT INTO investments
      (
        investor_id,
        property_id,
        amount,
        currency,
        status,
        notes,
        property_currency,
        exchange_rate,
        exchange_rate_source,
        exchange_rate_at,
        property_amount,
        settlement_currency
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        'pending',
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11
      )
      RETURNING *
      `,
      [
        investorId,
        property_id,
        numericAmount,
        settlementCurrency,
        notes || null,
        propertyCurrency,
        conversion.rate,
        conversion.source,
        conversion.rateAt,
        propertyAmount,
        settlementCurrency,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Investment request submitted successfully.",
      investment: result.rows[0],
      conversion: {
        from_currency: settlementCurrency,
        to_currency: propertyCurrency,
        investor_amount: numericAmount,
        property_amount: propertyAmount,
        exchange_rate: conversion.rate,
        exchange_rate_source: conversion.source,
        exchange_rate_at: conversion.rateAt,
      },
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    console.error("createInvestment error:", error);

    return res.status(500).json({
      error: error.message || "Unable to create investment request.",
    });
  } finally {
    client.release();
  }
};


/*
 * Get the logged-in investor's investments
 *
 * GET /api/investments/my-investments
 */
const getMyInvestments = async (req, res) => {
  try {
    const investorId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        i.*,
        p.title AS property_title,
        p.price AS property_price,
        p.currency AS property_currency,
        p.city,
        p.state_province,
        p.country,
        pi.image_url AS cover_image
      FROM investments i
      JOIN properties p
        ON p.id = i.property_id
      LEFT JOIN property_images pi
        ON pi.property_id = p.id
       AND pi.is_cover = true
      WHERE i.investor_id = $1
      ORDER BY i.created_at DESC
      `,
      [investorId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("getMyInvestments error:", error);

    return res.status(500).json({
      error: error.message || "Unable to load investments.",
    });
  }
};


/*
 * Get one investment belonging to the logged-in investor
 *
 * GET /api/investments/:id
 */
const getInvestmentById = async (req, res) => {
  try {
    const investorId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        i.*,
        p.title AS property_title,
        p.price AS property_price,
        p.currency AS property_currency,
        p.city,
        p.state_province,
        p.country,
        pi.image_url AS cover_image
      FROM investments i
      JOIN properties p
        ON p.id = i.property_id
      LEFT JOIN property_images pi
        ON pi.property_id = p.id
       AND pi.is_cover = true
      WHERE i.id = $1
        AND i.investor_id = $2
      `,
      [id, investorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Investment not found.",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("getInvestmentById error:", error);

    return res.status(500).json({
      error: error.message || "Unable to load investment.",
    });
  }
};


/*
 * Cancel a pending investment request
 *
 * DELETE /api/investments/:id
 */
const cancelInvestment = async (req, res) => {
  const client = await pool.connect();

  try {
    const investorId = req.user.id;
    const { id } = req.params;

    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE investments
      SET
        status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND investor_id = $2
        AND status = 'pending'
      RETURNING *
      `,
      [id, investorId]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Pending investment request not found.",
      });
    }

    await client.query("COMMIT");

    return res.json({
      message: "Investment request cancelled.",
      investment: result.rows[0],
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    console.error("cancelInvestment error:", error);

    return res.status(500).json({
      error: error.message || "Unable to cancel investment.",
    });
  } finally {
    client.release();
  }
};


/*
 * Investor portfolio summary
 *
 * GET /api/investments/summary
 */
const getInvestmentSummary = async (req, res) => {
  try {
    const investorId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE status IN ('approved', 'completed')
        ) AS active_investments,

        COUNT(*) FILTER (
          WHERE status = 'pending'
        ) AS pending_investments,

        COUNT(*) FILTER (
          WHERE status = 'rejected'
        ) AS rejected_investments,

        COUNT(*) FILTER (
          WHERE status = 'cancelled'
        ) AS cancelled_investments,

        COALESCE(
          SUM(amount) FILTER (
            WHERE status IN ('approved', 'completed')
          ),
          0
        ) AS total_invested,

        COALESCE(
          SUM(amount) FILTER (
            WHERE status = 'pending'
          ),
          0
        ) AS total_pending

      FROM investments
      WHERE investor_id = $1
      `,
      [investorId]
    );

    const byCurrency = await pool.query(
      `
      SELECT
        COALESCE(settlement_currency, currency, 'NGN') AS currency,

        COUNT(*) FILTER (
          WHERE status IN ('approved', 'completed')
        ) AS active_investments,

        COUNT(*) FILTER (
          WHERE status = 'pending'
        ) AS pending_investments,

        COALESCE(
          SUM(amount) FILTER (
            WHERE status IN ('approved', 'completed')
          ),
          0
        ) AS total_invested,

        COALESCE(
          SUM(amount) FILTER (
            WHERE status = 'pending'
          ),
          0
        ) AS total_pending

      FROM investments
      WHERE investor_id = $1
      GROUP BY COALESCE(settlement_currency, currency, 'NGN')
      ORDER BY currency
      `,
      [investorId]
    );

    return res.json({
      ...result.rows[0],
      by_currency: byCurrency.rows,
    });
  } catch (error) {
    console.error("getInvestmentSummary error:", error);

    return res.status(500).json({
      error: error.message || "Unable to load investment summary.",
    });
  }
};


module.exports = {
  createInvestment,
  getMyInvestments,
  getInvestmentById,
  cancelInvestment,
  getInvestmentSummary,
};
