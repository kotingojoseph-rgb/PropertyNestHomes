const express = require("express");
const router = express.Router();

const {
  paystackWebhook
} = require("../controllers/webhookController");


router.post("/", paystackWebhook);


module.exports = router;
