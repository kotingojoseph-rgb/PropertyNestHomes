const {
  Country,
  State,
  City
} = require("country-state-city");

const getCountries = (req, res) => {
  const countries = Country.getAllCountries().map(country => ({
    name: country.name,
    code: country.isoCode,
    currency: country.currency
  }));

  res.json(countries);
};

const getStates = (req, res) => {
  const { countryCode } = req.params;

  const states = State.getStatesOfCountry(countryCode);

  res.json(states);
};

const getCities = (req, res) => {
  const { countryCode, stateCode } = req.params;

  const cities = City.getCitiesOfState(
    countryCode,
    stateCode
  );

  res.json(cities);
};

module.exports = {
  getCountries,
  getStates,
  getCities
};
