const dns = require("dns");
const nodemailer = require("nodemailer");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD =
  process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD;

if (!EMAIL_USER || !EMAIL_PASSWORD) {
  console.warn("⚠️ Gmail SMTP credentials are not configured.");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,

  dnsLookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,

  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

async function sendEmail(to, subject, html) {
  console.log("EMAIL: starting SMTP connection");
  console.log("EMAIL: recipient:", to);
  console.log("EMAIL: sender configured:", !!EMAIL_USER);
  console.log("EMAIL: password configured:", !!EMAIL_PASSWORD);

  try {
    await transporter.verify();

    console.log("EMAIL: SMTP connection verified");

    const result = await transporter.sendMail({
      from: `"PropertyNestHomes" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("EMAIL: message sent:", result.messageId);

    return result;
  } catch (error) {
    console.error("EMAIL ERROR CODE:", error.code);
    console.error("EMAIL ERROR MESSAGE:", error.message);
    throw error;
  }
}

module.exports = {
  sendEmail,
};
