const dns = require("dns");
const nodemailer = require("nodemailer");

dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD,
  },
});

async function sendEmail(to, subject, html) {
  console.log("EMAIL: starting SMTP connection");
  console.log("EMAIL: recipient:", to);
  console.log("EMAIL: sender configured:", !!process.env.EMAIL_USER);
  console.log(
    "EMAIL: password configured:",
    !!(process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD)
  );

  try {
    console.log("EMAIL: verifying SMTP connection...");
    await transporter.verify();
    console.log("EMAIL: SMTP connection verified");

    console.log("EMAIL: sending message...");

    const result = await transporter.sendMail({
      from: `"PropertyNestHomes" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("EMAIL: message sent:", result.messageId);

    return result;
  } catch (error) {
    console.error("EMAIL ERROR:", error.code);
    console.error("EMAIL ERROR MESSAGE:", error.message);
    throw error;
  }
}

module.exports = {
  sendEmail,
};
