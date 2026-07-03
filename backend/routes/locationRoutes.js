const express = require("express");
const router = express.Router();

const {
  getCountries,
  getStates,
  getCities
} = require("../controllers/locationController");

router.get("/countries", getCountries);

router.get(
  "/states/:countryCode",
  getStates
);

router.get(
  "/cities/:countryCode/:stateCode",
  getCities
);

module.exports = router;
