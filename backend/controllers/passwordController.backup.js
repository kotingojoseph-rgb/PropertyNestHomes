const pool = require("../config/db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../services/emailService");

const RESET_TOKEN_EXPIRY_MINUTES = 15;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashResetToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function isValidPassword(password) {
  if (typeof password !== "string") {
    return false;
  }

  if (
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    return false;
  }

  return true;
}


// ============================================================
// FORGOT PASSWORD
// POST /api/password/forgot-password
// ============================================================

exports.forgotPassword = async (req, res) => {
  const email = normalizeEmail(req.body?.email);

  const genericMessage =
    "If this email exists, a password reset link has been sent.";

  if (!email) {
    return res.status(400).json({
      error: "Please enter your email address.",
    });
  }

  try {
    const userResult = await pool.query(
      `
      SELECT id, email
      FROM users
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [email]
    );

    // Do not reveal whether an email exists.
    if (userResult.rows.length === 0) {
      return res.json({
        message: genericMessage,
      });
    }

    const user = userResult.rows[0];

    // Remove any previous reset links.
    await pool.query(
      `
      DELETE FROM password_resets
      WHERE user_id = $1
      `,
      [user.id]
    );

    // Generate a cryptographically secure token.
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store only the SHA-256 hash.
    const tokenHash = hashResetToken(rawToken);

    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
    );

    await pool.query(
      `
      INSERT INTO password_resets
        (user_id, token, expires_at)
      VALUES
        ($1, $2, $3)
      `,
      [user.id, tokenHash, expiresAt]
    );

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "https://propertynesthomes-frontend.onrender.com";

    const resetUrl =
      `${frontendUrl.replace(/\/$/, "")}/reset-password/${rawToken}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your PropertyNestHomes password</title>
        </head>

        <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
          <div style="padding:40px 16px;">

            <div style="
              max-width:600px;
              margin:0 auto;
              background:#ffffff;
              border-radius:16px;
              overflow:hidden;
              box-shadow:0 4px 20px rgba(0,0,0,0.08);
            ">

              <div style="
                background:#16a34a;
                padding:28px 24px;
                text-align:center;
              ">
                <h1 style="
                  margin:0;
                  color:#ffffff;
                  font-size:26px;
                ">
                  PropertyNestHomes
                </h1>
              </div>

              <div style="padding:32px 28px;">

                <h2 style="
                  margin-top:0;
                  color:#111827;
                ">
                  Reset Your Password
                </h2>

                <p style="color:#4b5563;line-height:1.7;">
                  We received a request to reset the password for your
                  PropertyNestHomes account.
                </p>

                <p style="color:#4b5563;line-height:1.7;">
                  Click the button below to create a new password.
                  This link will expire in
                  <strong>${RESET_TOKEN_EXPIRY_MINUTES} minutes</strong>.
                </p>

                <div style="text-align:center;margin:32px 0;">
                  <a
                    href="${resetUrl}"
                    style="
                      display:inline-block;
                      background:#16a34a;
                      color:#ffffff;
                      text-decoration:none;
                      padding:14px 28px;
                      border-radius:8px;
                      font-weight:bold;
                      font-size:16px;
                    "
                  >
                    Reset My Password
                  </a>
                </div>

                <p style="color:#6b7280;font-size:14px;line-height:1.6;">
                  If you did not request a password reset, you can safely
                  ignore this email. Your current password will remain unchanged.
                </p>

                <hr style="border:0;border-top:1px solid #e5e7eb;margin:28px 0;">

                <p style="color:#9ca3af;font-size:12px;line-height:1.5;">
                  If the button does not work, copy and paste the following
                  address into your browser:
                </p>

                <p style="
                  color:#6b7280;
                  font-size:12px;
                  word-break:break-all;
                ">
                  ${resetUrl}
                </p>

              </div>

              <div style="
                background:#f9fafb;
                padding:20px;
                text-align:center;
              ">
                <p style="
                  margin:0;
                  color:#9ca3af;
                  font-size:12px;
                ">
                  © ${new Date().getFullYear()} PropertyNestHomes
                </p>
              </div>

            </div>

          </div>
        </body>
      </html>
    `;

    try {
      await sendEmail(
        user.email,
        "Reset your PropertyNestHomes password",
        emailHtml
      );
    } catch (emailError) {
      // Do not leave an unusable reset token in the database.
      await pool.query(
        `
        DELETE FROM password_resets
        WHERE user_id = $1
        AND token = $2
        `,
        [user.id, tokenHash]
      );

      console.error(
        "FORGOT PASSWORD EMAIL FAILED:",
        emailError.message
      );

      return res.status(503).json({
        error:
          "We could not send the password reset email right now. Please try again shortly.",
      });
    }

    return res.json({
      message: genericMessage,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return res.status(500).json({
      error:
        "Unable to process your password reset request right now.",
    });
  }
};


// ============================================================
// RESET PASSWORD
// POST /api/password/reset-password/:token
// ============================================================

exports.resetPassword = async (req, res) => {
  const rawToken = String(req.params?.token || "");
  const password = req.body?.password;

  if (!rawToken) {
    return res.status(400).json({
      error: "Invalid or expired password reset link.",
    });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      error: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`,
    });
  }

  const tokenHash = hashResetToken(rawToken);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const resetResult = await client.query(
      `
      SELECT id, user_id
      FROM password_resets
      WHERE token = $1
      AND expires_at > NOW()
      FOR UPDATE
      `,
      [tokenHash]
    );

    if (resetResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        error: "This password reset link is invalid or has expired.",
      });
    }

    const reset = resetResult.rows[0];

    const hashedPassword = await bcrypt.hash(password, 12);

    await client.query(
      `
      UPDATE users
      SET password = $1
      WHERE id = $2
      `,
      [hashedPassword, reset.user_id]
    );

    // Make the reset link immediately unusable.
    await client.query(
      `
      DELETE FROM password_resets
      WHERE id = $1
      `,
      [reset.id]
    );

    await client.query("COMMIT");

    return res.json({
      message:
        "Your password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "PASSWORD RESET ROLLBACK ERROR:",
        rollbackError.message
      );
    }

    console.error("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      error:
        "Unable to reset your password right now. Please try again.",
    });
  } finally {
    client.release();
  }
};
