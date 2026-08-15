const https = require("https");

function sendSMS(to, message) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.TERMII_API_KEY;
    const baseUrl = process.env.TERMII_BASE_URL;
    const senderId = process.env.TERMII_SENDER_ID || "PropertyNest";

    if (!apiKey || !baseUrl) {
      return reject(
        new Error("TERMII_API_KEY or TERMII_BASE_URL is not configured")
      );
    }

    let cleanBaseUrl = baseUrl.replace(/\/+$/, "");

    const payload = JSON.stringify({
      api_key: apiKey,
      to,
      from: senderId,
      sms: message,
      type: "plain",
      channel: "generic",
    });

    const url = new URL(`${cleanBaseUrl}/api/sms/send`);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: `${url.pathname}${url.search}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const request = https.request(options, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(data);
        } else {
          reject(
            new Error(
              `SMS provider returned ${response.statusCode}: ${data}`
            )
          );
        }
      });
    });

    request.on("error", reject);

    request.write(payload);
    request.end();
  });
}

module.exports = {
  sendSMS,
};
