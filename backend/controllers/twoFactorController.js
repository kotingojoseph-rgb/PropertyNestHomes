const pool = require("../config/db");
const QRCode = require("qrcode");
const jwt = require("jsonwebtoken");
const { generateSecret, generateURI, verify } = require("otplib");

const issueFullToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

// ------------------------------------------------------------
// SETUP 2FA
// ------------------------------------------------------------
const setupTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT id, email, two_factor_enabled
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const user = result.rows[0];

    if (user.two_factor_enabled) {
      return res.status(400).json({
        error: "Two-factor authentication is already enabled.",
      });
    }

    const secret = generateSecret();

    const otpauthUrl = generateURI({
      issuer: "PropertyNestHomes",
      label: user.email,
      secret,
    });

    const qrCode = await QRCode.toDataURL(otpauthUrl);

    await pool.query(
      `
      UPDATE users
      SET
        two_factor_secret = $1,
        two_factor_enabled = FALSE
      WHERE id = $2
      `,
      [secret, userId]
    );

    return res.json({
      message: "2FA setup initialized.",
      qrCode,
      secret,
    });
  } catch (err) {
    console.error("2FA setup error:", err);

    return res.status(500).json({
      error: "Failed to initialize 2FA setup.",
    });
  }
};

// ------------------------------------------------------------
// VERIFY SETUP AND ENABLE 2FA
// ------------------------------------------------------------
const verifyTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "Authenticator code is required.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        two_factor_secret,
        two_factor_enabled
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const user = result.rows[0];

    if (!user.two_factor_secret) {
      return res.status(400).json({
        error: "2FA setup has not been initialized.",
      });
    }

    const verification = await verify({
      secret: user.two_factor_secret,
      token: String(token).trim(),
    });

    if (!verification) {
      return res.status(400).json({
        error: "Invalid authenticator code.",
      });
    }

    await pool.query(
      `
      UPDATE users
      SET two_factor_enabled = TRUE
      WHERE id = $1
      `,
      [userId]
    );

    return res.json({
      message: "Two-factor authentication enabled successfully.",
    });
  } catch (err) {
    console.error("2FA verification error:", err);

    return res.status(500).json({
      error: "Failed to verify authenticator code.",
    });
  }
};

// ------------------------------------------------------------
// LOGIN 2FA VERIFICATION
// ------------------------------------------------------------
const verifyLoginTwoFactor = async (req, res) => {
  try {
    const { challengeToken, token } = req.body;

    if (!challengeToken || !token) {
      return res.status(400).json({
        error: "Challenge token and authenticator code are required.",
      });
    }

    let challenge;

    try {
      challenge = jwt.verify(
        challengeToken,
        process.env.JWT_SECRET
      );
    } catch (err) {
      return res.status(401).json({
        error: "Invalid or expired 2FA challenge.",
      });
    }

    if (
      challenge.type !== "2fa_pending" ||
      !challenge.id
    ) {
      return res.status(401).json({
        error: "Invalid 2FA challenge.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        role,
        two_factor_enabled,
        two_factor_secret
      FROM users
      WHERE id = $1
      `,
      [challenge.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "User account not found.",
      });
    }

    const user = result.rows[0];

    if (
      !user.two_factor_enabled ||
      !user.two_factor_secret
    ) {
      return res.status(400).json({
        error: "Two-factor authentication is not enabled.",
      });
    }

    const verification = await verify({
      secret: user.two_factor_secret,
      token: String(token).trim(),
    });

    if (!verification) {
      return res.status(401).json({
        error: "Invalid authenticator code.",
      });
    }

    const accessToken = issueFullToken(user);

    return res.json({
      message: "Login successful.",
      token: accessToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login 2FA verification error:", err);

    return res.status(500).json({
      error: "Failed to verify login authenticator code.",
    });
  }
};

// ------------------------------------------------------------
// DISABLE 2FA
// ------------------------------------------------------------
const disableTwoFactor = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "Authenticator code is required.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        two_factor_secret,
        two_factor_enabled
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const user = result.rows[0];

    if (
      !user.two_factor_enabled ||
      !user.two_factor_secret
    ) {
      return res.status(400).json({
        error: "Two-factor authentication is not enabled.",
      });
    }

    const verification = await verify({
      secret: user.two_factor_secret,
      token: String(token).trim(),
    });

    if (!verification) {
      return res.status(400).json({
        error: "Invalid authenticator code.",
      });
    }

    await pool.query(
      `
      UPDATE users
      SET
        two_factor_enabled = FALSE,
        two_factor_secret = NULL
      WHERE id = $1
      `,
      [userId]
    );

    return res.json({
      message: "Two-factor authentication disabled successfully.",
    });
  } catch (err) {
    console.error("2FA disable error:", err);

    return res.status(500).json({
      error: "Failed to disable 2FA.",
    });
  }
};

module.exports = {
  setupTwoFactor,
  verifyTwoFactor,
  verifyLoginTwoFactor,
  disableTwoFactor,
};
