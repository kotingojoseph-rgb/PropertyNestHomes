require("dotenv").config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const dns = require("dns").promises;
const { Pool } = require("pg");

const databaseUrl = new URL(process.env.DATABASE_URL);
const databaseHost = databaseUrl.hostname;

let pool = null;

async function createPool() {
  const addresses =
    await dns.resolve4(databaseHost);

  if (!addresses.length) {
    throw new Error(
      `No IPv4 address found for ${databaseHost}`
    );
  }

  const ipv4 = addresses[0];

  console.log(
    `🔌 Neon PostgreSQL IPv4: ${ipv4}`
  );

  pool = new Pool({
    host: ipv4,

    port: Number(
      databaseUrl.port || 5432
    ),

    database:
      databaseUrl.pathname.replace(
        /^\//,
        ""
      ),

    user:
      decodeURIComponent(
        databaseUrl.username
      ),

    password:
      decodeURIComponent(
        databaseUrl.password
      ),

    /*
     * Keep the original Neon hostname
     * for TLS SNI even though the TCP
     * connection uses IPv4.
     */
    ssl: {
      rejectUnauthorized: false,
      servername: databaseHost,
    },

    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  });

  pool.on("connect", () => {
    console.log(
      "✅ Connected to PostgreSQL"
    );
  });

  pool.on("error", (err) => {
    console.error(
      "❌ Unexpected PostgreSQL error:",
      err
    );
  });

  return pool;
}

/*
 * Keep the existing pool.query() interface
 * used throughout the backend.
 */
const poolProxy = {
  async query(...args) {
    if (!pool) {
      await createPool();
    }

    return pool.query(...args);
  },

  async connect(...args) {
    if (!pool) {
      await createPool();
    }

    return pool.connect(...args);
  },

  async end(...args) {
    if (pool) {
      return pool.end(...args);
    }
  },

  on(...args) {
    if (pool) {
      pool.on(...args);
    }

    return poolProxy;
  },
};

module.exports = poolProxy;
