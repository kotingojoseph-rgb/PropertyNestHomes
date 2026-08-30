const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function submitContactMessage(req, res) {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const message = String(req.body?.message || "").trim();

    if (!name || !email || !message) {
      return res.status(400).json({
        error: "Name, email, and message are required.",
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        error: "Name is too long.",
      });
    }

    if (email.length > 254) {
      return res.status(400).json({
        error: "Email address is too long.",
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        error: "Message is too long.",
      });
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return res.status(400).json({
        error: "Please enter a valid email address.",
      });
    }

    const recipient = process.env.EMAIL_USER;

    if (!recipient) {
      console.error("CONTACT ERROR: EMAIL_USER is not configured.");

      return res.status(500).json({
        error: "Contact service is temporarily unavailable.",
      });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "PropertyNestHomes <onboarding@resend.dev>",
      to: recipient,
      reply_to: email,
      subject: `New PropertyNestHomes contact message from ${name}`,
      text: [
        "New PropertyNestHomes contact message",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        "",
        "Message:",
        message,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;">
          <h2>New PropertyNestHomes Contact Message</h2>

          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>

          <hr />

          <p><strong>Message:</strong></p>

          <div
            style="
              white-space:pre-wrap;
              background:#f8fafc;
              border:1px solid #e2e8f0;
              border-radius:8px;
              padding:16px;
            "
          >${safeMessage}</div>

          <p style="margin-top:20px;color:#64748b;">
            Reply directly to this email to respond to the visitor.
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully.",
    });
  } catch (error) {
    console.error(
      "CONTACT EMAIL ERROR:",
      error?.message || error
    );

    return res.status(500).json({
      error: "Unable to send your message right now. Please try again later.",
    });
  }
}

module.exports = {
  submitContactMessage,
};
