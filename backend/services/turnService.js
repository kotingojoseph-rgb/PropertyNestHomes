require("dotenv").config();

const axios = require("axios");

const CLOUDFLARE_TURN_URL =
  "https://rtc.live.cloudflare.com/v1/turn/keys";

async function generateTurnCredentials() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const turnKeyId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !turnKeyId || !apiToken) {
    throw new Error(
      "Cloudflare TURN environment variables are not configured"
    );
  }

  const response = await axios.post(
    `${CLOUDFLARE_TURN_URL}/${turnKeyId}/credentials/generate-ice-servers`,
    {
      ttl: 86400,
    },
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    }
  );

  return response.data;
}

module.exports = {
  generateTurnCredentials,
};
