const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
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
