const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

async function sendEmail(to, subject, html) {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const from =
    process.env.RESEND_FROM_EMAIL ||
    "PropertyNestHomes <onboarding@resend.dev>";

  console.log("EMAIL API: sending");
  console.log("EMAIL API recipient:", to);
  console.log("EMAIL API sender:", from);

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error("RESEND ERROR:", error);
    throw new Error(error.message || "Resend email failed");
  }

  console.log("EMAIL API sent:", data?.id);

  return data;
}

module.exports = {
  sendEmail,
};
