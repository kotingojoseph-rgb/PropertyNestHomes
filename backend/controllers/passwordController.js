const pool = require("../config/db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../services/emailService");
const { sendSMS } = require("../services/smsService");

function normalizePhone(phone) {
  if (!phone) return null;

  const value = String(phone).trim();

  // Already international
  if (value.startsWith("+")) {
    return value;
  }

  // Nigeria local format: 08012345678 -> +2348012345678
  if (value.startsWith("0") && value.length === 11) {
    return `+234${value.slice(1)}`;
  }

  return value;
}

// Request password reset
exports.forgotPassword = async (req, res) => {
  try {
    const identifier = String(
      req.body.identifier || req.body.email || req.body.phone || ""
    ).trim();

    if (!identifier) {
      return res.status(400).json({
        error: "Email or phone number is required",
      });
    }

    const isEmail = identifier.includes("@");

    const userResult = isEmail
      ? await pool.query(
          `SELECT id, email, phone, full_name
           FROM users
           WHERE LOWER(email) = LOWER($1)
           LIMIT 1`,
          [identifier]
        )
      : await pool.query(
          `SELECT id, email, phone, full_name
           FROM users
           WHERE phone = $1
           LIMIT 1`,
          [identifier]
        );

    // Always return the same response so account existence is not exposed.
    if (userResult.rows.length === 0) {
      return res.json({
        message:
          "If an account matches that email or phone number, a password reset message has been sent.",
      });
    }

    const user = userResult.rows[0];

    // Remove previous reset tokens
    await pool.query(
      `DELETE FROM password_resets
       WHERE user_id = $1`,
      [user.id]
    );

    const token = crypto.randomBytes(32).toString("hex");

    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    await pool.query(
      `INSERT INTO password_resets
       (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expires]
    );

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "https://propertynesthomes-frontend.onrender.com";

    const resetUrl = `${frontendUrl}/reset-password/${token}`;

    const normalizedPhone = normalizePhone(user.phone);

    const results = {
      email: false,
      sms: false,
    };

    // EMAIL
    if (user.email) {
      try {
        await sendEmail(
          user.email,
          "Reset your PropertyNestHomes password",
          `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
            <h2>PropertyNestHomes Password Reset</h2>

            <p>Hello ${user.full_name || "there"},</p>

            <p>
              We received a request to reset your PropertyNestHomes password.
            </p>

            <p>
              Click the button below to choose a new password.
              This link expires in 15 minutes.
            </p>

            <p>
              <a
                href="${resetUrl}"
                style="
                  display:inline-block;
                  padding:12px 20px;
                  background:#16a34a;
                  color:#fff;
                  text-decoration:none;
                  border-radius:6px;
                "
              >
                Reset Password
              </a>
            </p>

            <p>
              If you did not request this reset, you can safely ignore this email.
            </p>

            <p>
              PropertyNestHomes
            </p>
          </div>
          `
        );

        results.email = true;
      } catch (emailError) {
        console.error("Password reset email failed:", emailError.message);
      }
    }

    // SMS
    if (normalizedPhone) {
      try {
        const smsMessage =
          `PropertyNestHomes: Your password reset link is ${resetUrl}. ` +
          `This link expires in 15 minutes. If you did not request this, ignore this message.`;

        await sendSMS(normalizedPhone, smsMessage);

        results.sms = true;
      } catch (smsError) {
        console.error("Password reset SMS failed:", smsError.message);
      }
    }

    console.log("Password reset delivery:", {
      userId: user.id,
      emailSent: results.email,
      smsSent: results.sms,
    });

    return res.json({
      message:
        "If an account matches that email or phone number, a password reset message has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      error: "Unable to process password reset request.",
    });
  }
};


// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: "Password required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    const reset = await pool.query(
      `SELECT *
       FROM password_resets
       WHERE token = $1
       AND expires_at > NOW()
       LIMIT 1`,
      [token]
    );

    if (reset.rows.length === 0) {
      return res.status(400).json({
        error: "Invalid or expired token",
      });
    }

    const userId = reset.rows[0].user_id;

    const hashedPassword = await bcrypt.hash(password, 12);

    await pool.query(
      `UPDATE users
       SET password = $1
       WHERE id = $2`,
      [hashedPassword, userId]
    );

    await pool.query(
      `DELETE FROM password_resets
       WHERE token = $1`,
      [token]
    );

    return res.json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      error: "Unable to reset password",
    });
  }
};
