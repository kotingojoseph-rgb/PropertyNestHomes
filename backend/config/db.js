require("dotenv").config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Successful connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL");
});

// Unexpected errors
pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL error:", err);
});

module.exports = pool;
