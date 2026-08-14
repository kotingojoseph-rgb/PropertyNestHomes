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

async function sendEmail(to, subject, html) {
  await transporter.sendMail({
    from: `"PropertyNestHomes" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = {
  sendEmail,
};
