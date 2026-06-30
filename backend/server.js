const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const propertyRoutes = require("./routes/propertyRoutes");

propertyRoutes.stack.forEach((layer) => {
  if (layer.route) {
    console.log(
      layer.route.path,
      Object.keys(layer.route.methods)
    );
  }
});

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests, please try again later."
  }
});
app.use(cors());
app.use(limiter);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    app: "PropertyNestHomes API",
    status: "running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/properties", propertyRoutes);
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
