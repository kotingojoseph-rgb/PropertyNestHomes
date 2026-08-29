const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createInvestment,
  getMyInvestments,
  getInvestmentById,
  cancelInvestment,
  getInvestmentSummary,
} = require("../controllers/investmentController");

router.post(
  "/",
  authMiddleware,
  createInvestment
);

router.get(
  "/my-investments",
  authMiddleware,
  getMyInvestments
);

router.get(
  "/summary",
  authMiddleware,
  getInvestmentSummary
);

router.get(
  "/:id",
  authMiddleware,
  getInvestmentById
);

router.delete(
  "/:id",
  authMiddleware,
  cancelInvestment
);

module.exports = router;
