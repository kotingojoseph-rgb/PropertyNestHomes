import { useEffect, useState } from "react";

function AddProperty() {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    country: "",
    state_province: "",
    city: "",
    address: "",
    postal_code: "",
    currency: "",
    bedrooms: "",
    bathrooms: "",
    property_type: "",
    status: "Available"
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/locations/countries`)
      .then((res) => res.json())
      .then((data) => setCountries(data))
      .catch((err) => console.error(err));
  }, []);

  const handleCountryChange = async (e) => {
    const countryCode = e.target.value;

    const selectedCountry = countries.find(
      (country) => country.code === countryCode
    );

    setFormData({
      ...formData,
      country: selectedCountry.name,
      currency: selectedCountry.currency,
      state_province: "",
      city: ""
    });

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/locations/states/${countryCode}`
    );

    const data = await response.json();

    setStates(data);
    setCities([]);
  };

  const handleStateChange = async (e) => {
    const stateCode = e.target.value;

    const selectedState = states.find(
      (state) => state.isoCode === stateCode
    );

    setFormData({
      ...formData,
      state_province: selectedState.name,
      city: ""
    });

    const country = countries.find(
      (c) => c.name === formData.country
    );

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/locations/cities/${country.code}/${stateCode}`
    );

    const data = await response.json();

    setCities(data);
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Add Property</h1>

      <div>
        <label>Country</label>
        <br />

        <select onChange={handleCountryChange}>
          <option>Select Country</option>

          {countries.map((country) => (
            <option
              key={country.code}
              value={country.code}
            >
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <br />

      <div>
        <label>State</label>
        <br />

        <select onChange={handleStateChange}>
          <option>Select State</option>

          {states.map((state) => (
            <option
              key={state.isoCode}
              value={state.isoCode}
            >
              {state.name}
            </option>
          ))}
        </select>
      </div>

      <br />

      <div>
        <label>City</label>
        <br />

        <select
          onChange={(e) =>
            setFormData({
              ...formData,
              city: e.target.value
            })
          }
        >
          <option>Select City</option>

          {cities.map((city) => (
            <option
              key={city.name}
              value={city.name}
            >
              {city.name}
            </option>
          ))}
        </select>
      </div>

      <br />

      <p>
        Selected Country: {formData.country}
      </p>

      <p>
        Selected State: {formData.state_province}
      </p>

      <p>
        Selected City: {formData.city}
      </p>

      <p>
        Currency: {formData.currency}
      </p>
    </div>
  );
}

export default AddProperty;
