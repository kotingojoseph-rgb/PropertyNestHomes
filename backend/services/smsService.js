const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

async function sendSMS(to, message) {
  if (!client) {
    throw new Error(
      "TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is not configured"
    );
  }

  if (!fromNumber) {
    throw new Error(
      "TWILIO_PHONE_NUMBER is not configured"
    );
  }

  if (!to) {
    throw new Error("SMS recipient phone number is required");
  }

  if (!message) {
    throw new Error("SMS message is required");
  }

  const result = await client.messages.create({
    body: String(message),
    from: fromNumber,
    to: String(to),
  });

  console.log("Twilio SMS sent:", {
    sid: result.sid,
    to: result.to,
    status: result.status,
  });

  return result;
}

module.exports = {
  sendSMS,
};
