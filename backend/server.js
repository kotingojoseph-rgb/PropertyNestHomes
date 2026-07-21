require("dotenv").config();

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

const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const locationRoutes = require("./routes/locationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const adRoutes = require("./routes/adRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const promotionRoutes = require("./routes/promotionRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();

app.disable("x-powered-by");

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://propertynesthomes-frontend.onrender.com",
  "https://propertynesthomes.onrender.com",
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
app.use("/api/promotions", promotionRoutes);

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

app.listen(PORT, () => {
  console.log(`🚀 PropertyNestHomes API running on port ${PORT}`);
});
