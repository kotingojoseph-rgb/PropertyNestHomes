const SUPPORTED_CURRENCIES = [
  "NGN",
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "ZAR",
  "KES",
  "GHS",
  "AED",
];

const RATE_API_BASE =
  process.env.CURRENCY_RATE_API_BASE ||
  "https://open.er-api.com/v6/latest";

function normalizeCurrency(currency) {
  return String(currency || "").trim().toUpperCase();
}

function isSupportedCurrency(currency) {
  return SUPPORTED_CURRENCIES.includes(normalizeCurrency(currency));
}

async function getExchangeRate(fromCurrency, toCurrency) {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);

  if (!isSupportedCurrency(from)) {
    throw new Error(`Unsupported source currency: ${from}`);
  }

  if (!isSupportedCurrency(to)) {
    throw new Error(`Unsupported target currency: ${to}`);
  }

  if (from === to) {
    return {
      from,
      to,
      rate: 1,
      source: "same_currency",
      rateAt: new Date(),
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(
      `${RATE_API_BASE}/${encodeURIComponent(from)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Currency rate provider returned HTTP ${response.status}.`
      );
    }

    const data = await response.json();

    if (!data || data.result !== "success" || !data.rates) {
      throw new Error("Currency rate provider returned an invalid response.");
    }

    const rate = Number(data.rates[to]);

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(
        `No valid exchange rate available for ${from} to ${to}.`
      );
    }

    let rateAt = new Date();

    if (data.time_last_update_utc) {
      const parsed = new Date(data.time_last_update_utc);

      if (!Number.isNaN(parsed.getTime())) {
        rateAt = parsed;
      }
    }

    return {
      from,
      to,
      rate,
      source: "open.er-api.com",
      rateAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function convertCurrency(amount, fromCurrency, toCurrency) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const conversion = await getExchangeRate(
    fromCurrency,
    toCurrency
  );

  const convertedAmount = numericAmount * conversion.rate;

  return {
    ...conversion,
    amount: numericAmount,
    convertedAmount,
  };
}

module.exports = {
  SUPPORTED_CURRENCIES,
  normalizeCurrency,
  isSupportedCurrency,
  getExchangeRate,
  convertCurrency,
};
