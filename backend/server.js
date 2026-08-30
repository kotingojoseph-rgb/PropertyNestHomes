require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const requiredEnv = [
  "DATABASE_URL",
  "JWT_SECRET"
];

for (const variable of requiredEnv) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const http = require("http");


const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const locationRoutes = require("./routes/locationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const adRoutes = require("./routes/adRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const investmentRoutes = require("./routes/investmentRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const messageRoutes = require("./routes/messageRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const twoFactorRoutes = require("./routes/twoFactorRoutes");
const statusRoutes = require("./routes/statusRoutes");
const callRoutes = require("./routes/callRoutes");

const app = express();

app.disable("x-powered-by");

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://propertynesthomes-frontend.onrender.com",
  "https://propertynesthomes.onrender.com",
  "https://propertynesthomes.com",
  "https://www.propertynesthomes.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// Logging
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later.",
  },
});

app.use(limiter);

// Paystack webhook (must receive raw body)
app.use(
  "/api/webhook/paystack",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

// JSON body parser
app.use(
  express.json({
    limit: "1mb",
  })
);

// Static uploads


app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/ads", adRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/promotions", promotionRoutes);

app.use("/api/chat", messageRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/2fa", twoFactorRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/calls", callRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    app: "PropertyNestHomes API",
    status: "running",
    environment: process.env.NODE_ENV || "development",
  });
});
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;

  res.status(status).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const { initSocket } = require("./socket");
const pool = require("./config/db");

async function runChatMigrations() {
  try {
    // Real-time user presence
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_presence (
        user_id INTEGER PRIMARY KEY
          REFERENCES users(id)
          ON DELETE CASCADE,
        socket_id TEXT,
        is_online BOOLEAN DEFAULT FALSE,
        last_seen TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Video/audio call history
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calls (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL
          REFERENCES conversations(id)
          ON DELETE CASCADE,
        caller_id INTEGER NOT NULL
          REFERENCES users(id)
          ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL
          REFERENCES users(id)
          ON DELETE CASCADE,
        call_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'ringing',
        started_at TIMESTAMP,
        answered_at TIMESTAMP,
        ended_at TIMESTAMP,
        duration INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_calls_conversation
      ON calls(conversation_id)
    `);

    await pool.query(`
      ALTER TABLE conversations
      ALTER COLUMN property_id DROP NOT NULL
    `);

    await pool.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS video_url TEXT
    `);

    await pool.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'text'
    `);

    await pool.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_direct_chat
      ON conversations(buyer_id, seller_id)
      WHERE property_id IS NULL
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_media_type
      ON messages(media_type)
    `);

      // Message deletion support
      await pool.query(`
        ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL
      `);

      await pool.query(`
        ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS deleted_by INTEGER NULL
          REFERENCES users(id)
          ON DELETE SET NULL
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_messages_deleted_at
        ON messages(deleted_at)
      `);

    console.log("✅ Chat database migration completed");

  } catch (error) {
    console.error("❌ Chat database migration failed:", error);
    throw error;
  }
}

initSocket(server);

runChatMigrations()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 PropertyNestHomes API running on port ${PORT}`);
    });
  })
  .catch(() => {
    process.exit(1);
  });
