const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD,
  },
});

async function sendVerificationEmail(to, verificationUrl) {
  await transporter.sendMail({
    from: `"PropertyNestHomes" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your PropertyNestHomes account",
    text: `Welcome to PropertyNestHomes!

Please verify your email address by opening this link:

${verificationUrl}

This verification link expires in 24 hours.

If you did not create this account, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2>Welcome to PropertyNestHomes</h2>

        <p>Thank you for creating your account.</p>

        <p>Please verify your email address by clicking the button below:</p>

        <p>
          <a
            href="${verificationUrl}"
            style="
              display:inline-block;
              padding:12px 20px;
              background:#2563eb;
              color:white;
              text-decoration:none;
              border-radius:6px;
            "
          >
            Verify Email
          </a>
        </p>

        <p>This verification link expires in 24 hours.</p>

        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });
}

module.exports = {
  transporter,
  sendVerificationEmail,
};
