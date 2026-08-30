import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const initialForm = {
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
  property_type: "House",
  property_registration_id: "",
};

const steps = [
  { number: 1, title: "Details" },
  { number: 2, title: "Location" },
  { number: 3, title: "Photos" },
  { number: 4, title: "Document" },
  { number: 5, title: "Review" },
];

export default function AddProperty() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [formData, setFormData] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [document, setDocument] = useState(null);

  const [loadingLocations, setLoadingLocations] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const response = await fetch(`${API_URL}/api/locations/countries`);

        if (!response.ok) {
          throw new Error("Unable to load countries");
        }

        const data = await response.json();
        setCountries(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load location information.");
      }
    };

    loadCountries();
  }, []);

  const updateField = (name, value) => {
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCountryChange = async (e) => {
    const countryCode = e.target.value;

    if (!countryCode) {
      setFormData((previous) => ({
        ...previous,
        country: "",
        currency: "",
        state_province: "",
        city: "",
      }));

      setStates([]);
      setCities([]);
      return;
    }

    const selectedCountry = countries.find(
      (country) => country.code === countryCode
    );

    if (!selectedCountry) return;

    setFormData((previous) => ({
      ...previous,
      country: selectedCountry.name,
      currency: selectedCountry.currency || "",
      state_province: "",
      city: "",
    }));

    setStates([]);
    setCities([]);
    setLoadingLocations(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/locations/states/${countryCode}`
      );

      if (!response.ok) {
        throw new Error("Unable to load states");
      }

      const data = await response.json();
      setStates(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load states for this country.");
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleStateChange = async (e) => {
    const stateCode = e.target.value;

    if (!stateCode) {
      setFormData((previous) => ({
        ...previous,
        state_province: "",
        city: "",
      }));

      setCities([]);
      return;
    }

    const selectedState = states.find(
      (state) => state.isoCode === stateCode
    );

    const selectedCountry = countries.find(
      (country) => country.name === formData.country
    );

    if (!selectedState || !selectedCountry) return;

    setFormData((previous) => ({
      ...previous,
      state_province: selectedState.name,
      city: "",
    }));

    setCities([]);
    setLoadingLocations(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/locations/cities/${selectedCountry.code}/${stateCode}`
      );

      if (!response.ok) {
        throw new Error("Unable to load cities");
      }

      const data = await response.json();
      setCities(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load cities for this state.");
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 10) {
      setError("You can upload a maximum of 10 property images.");
      e.target.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (files.some((file) => !allowedTypes.includes(file.type))) {
      setError("Property images must be JPG, PNG, or WEBP.");
      e.target.value = "";
      return;
    }

    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      setError("Each property image must be 10MB or smaller.");
      e.target.value = "";
      return;
    }

    setError("");
    setImages(files);
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setDocument(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Certificate must be PDF, JPG, PNG, or WEBP.");
      e.target.value = "";
      setDocument(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Certificate must be 10MB or smaller.");
      e.target.value = "";
      setDocument(null);
      return;
    }

    setError("");
    setDocument(file);
  };

  const validateStep = () => {
    setError("");

    if (step === 1) {
      if (!formData.title.trim() || formData.title.trim().length < 5) {
        setError("Property title must be at least 5 characters.");
        return false;
      }

      if (!formData.description.trim() || formData.description.trim().length < 20) {
        setError("Property description must be at least 20 characters.");
        return false;
      }

      if (!formData.price || Number(formData.price) <= 0) {
        setError("Please enter a valid property price.");
        return false;
      }

      if (!formData.property_type) {
        setError("Please select a property type.");
        return false;
      }
    }

    if (step === 2) {
      if (!formData.country || !formData.city) {
        setError("Please select the property country and city.");
        return false;
      }

      if (!formData.address.trim()) {
        setError("Please enter the property address.");
        return false;
      }
    }

    if (step === 3 && images.length === 0) {
      setError("Please upload at least one property photo.");
      return false;
    }

    if (step === 4) {
      if (!formData.property_registration_id.trim()) {
        setError("Please enter the Property Registration ID.");
        return false;
      }

      if (formData.property_registration_id.trim().length > 255) {
        setError("Property Registration ID must be 255 characters or fewer.");
        return false;
      }

      if (!document) {
        setError("Please upload the Property Registration Certificate.");
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;

    setStep((previous) => Math.min(previous + 1, 5));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const previousStep = () => {
    setError("");
    setStep((previous) => Math.max(previous - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const previewUrls = useMemo(
    () =>
      images.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [images]
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previewUrls]);

  const handleSubmit = async () => {
    // Validate the complete listing before creating anything.
    if (!formData.title.trim() || formData.title.trim().length < 5) {
      setStep(1);
      setError("Property title must be at least 5 characters.");
      return;
    }

    if (
      !formData.description.trim() ||
      formData.description.trim().length < 20
    ) {
      setStep(1);
      setError("Property description must be at least 20 characters.");
      return;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      setStep(1);
      setError("Please enter a valid property price.");
      return;
    }

    if (!formData.property_type) {
      setStep(1);
      setError("Please select a property type.");
      return;
    }

    if (!formData.country || !formData.city) {
      setStep(2);
      setError("Please select the property country and city.");
      return;
    }

    if (!formData.address.trim()) {
      setStep(2);
      setError("Please enter the property address.");
      return;
    }

    if (images.length === 0) {
      setStep(3);
      setError("Please upload at least one property photo.");
      return;
    }

    if (!formData.property_registration_id.trim()) {
      setStep(4);
      setError("Please enter the Property Registration ID.");
      return;
    }

    if (formData.property_registration_id.trim().length > 255) {
      setStep(4);
      setError("Property Registration ID must be 255 characters or fewer.");
      return;
    }

    if (!document) {
      setStep(4);
      setError("Please upload the Property Registration Certificate.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    let propertyId = null;

    try {
      /*
       * Create the property first because the backend needs its ID
       * to associate Cloudinary images and documents.
       */
      const propertyResponse = await fetch(`${API_URL}/api/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const propertyData = await propertyResponse.json();

      if (!propertyResponse.ok) {
        throw new Error(
          propertyData.message ||
            propertyData.error ||
            "Unable to create property."
        );
      }

      propertyId = propertyData.property?.id;

      if (!propertyId) {
        throw new Error("Property was created without a property ID.");
      }

      // Upload all property photos.
      const imageForm = new FormData();

      images.forEach((image) => {
        imageForm.append("images", image);
      });

      const imageResponse = await fetch(
        `${API_URL}/api/properties/${propertyId}/images`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: imageForm,
        }
      );

      const imageData = await imageResponse.json();

      if (!imageResponse.ok) {
        throw new Error(
          imageData.message ||
            imageData.error ||
            "The property was created, but the photos could not be uploaded."
        );
      }

      // Upload the required registration document.
      const documentForm = new FormData();

      documentForm.append(
        "document_type",
        "Property Registration Certificate"
      );
      documentForm.append("document", document);

      const documentResponse = await fetch(
        `${API_URL}/api/properties/${propertyId}/documents`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: documentForm,
        }
      );

      const documentData = await documentResponse.json();

      if (!documentResponse.ok) {
        throw new Error(
          documentData.message ||
            documentData.error ||
            "The property photos were uploaded, but the registration certificate could not be uploaded."
        );
      }

      setSuccess(
        "Property submitted successfully. Your listing is now pending verification."
      );

      setTimeout(() => {
        navigate("/dashboard");
      }, 1800);
    } catch (err) {
      console.error("Add property error:", err);

      setError(
        err.message ||
          "We could not complete your property submission. Please try again."
      );

      /*
       * Do not automatically reset the form.
       * The user's entered information and selected files remain available
       * so they can retry without filling everything again.
       */
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white p-3.5 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-green-600">
            PropertyNestHomes
          </p>

          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            Add Your Property
          </h1>

          <p className="mt-2 text-gray-600">
            Complete the steps below to submit your property for verification.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 min-w-0 overflow-x-auto rounded-2xl bg-white p-3 shadow-sm sm:p-4">
          <div className="flex min-w-0 items-center justify-between gap-3 sm:min-w-[600px]">
            {steps.map((item, index) => (
              <div key={item.number} className="flex flex-1 items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                      step >= item.number
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {item.number}
                  </div>

                  <span
                    className={`text-sm font-semibold ${
                      step >= item.number
                        ? "text-green-700"
                        : "text-gray-500"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`mx-3 h-1 flex-1 rounded ${
                      step > item.number ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
          {/* STEP 1 */}
          {step === 1 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                Property Details
              </h2>

              <p className="mt-1 text-gray-500">
                Tell buyers about the property.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Property Title
                  </label>
                  <input
                    className={inputClass}
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="e.g. Luxury 5 Bedroom Duplex"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <textarea
                    className={inputClass}
                    rows="6"
                    value={formData.description}
                    onChange={(e) =>
                      updateField("description", e.target.value)
                    }
                    placeholder="Describe the property, features, surroundings and anything buyers should know..."
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Price
                    </label>
                    <input
                      type="number"
                      min="1"
                      className={inputClass}
                      value={formData.price}
                      onChange={(e) => updateField("price", e.target.value)}
                      placeholder="Property price"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Property Type
                    </label>
                    <select
                      className={inputClass}
                      value={formData.property_type}
                      onChange={(e) =>
                        updateField("property_type", e.target.value)
                      }
                    >
                      <option value="House">House</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Villa">Villa</option>
                      <option value="Duplex">Duplex</option>
                      <option value="Condo">Condo</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Land">Land</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Office">Office</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      min="0"
                      className={inputClass}
                      value={formData.bedrooms}
                      onChange={(e) =>
                        updateField("bedrooms", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      min="0"
                      className={inputClass}
                      value={formData.bathrooms}
                      onChange={(e) =>
                        updateField("bathrooms", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                Property Location
              </h2>

              <p className="mt-1 text-gray-500">
                Tell us where the property is located.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Country
                  </label>
                  <select
                    className={inputClass}
                    value={
                      countries.find(
                        (country) => country.name === formData.country
                      )?.code || ""
                    }
                    onChange={handleCountryChange}
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    State / Province
                  </label>
                  <select
                    className={inputClass}
                    disabled={!states.length || loadingLocations}
                    value={
                      states.find(
                        (state) => state.name === formData.state_province
                      )?.isoCode || ""
                    }
                    onChange={handleStateChange}
                  >
                    <option value="">Select state / province</option>
                    {states.map((state) => (
                      <option key={state.isoCode} value={state.isoCode}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    City
                  </label>
                  <select
                    className={inputClass}
                    disabled={!cities.length || loadingLocations}
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  >
                    <option value="">Select city</option>
                    {cities.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Currency
                  </label>
                  <input
                    className={`${inputClass} bg-gray-100`}
                    value={formData.currency}
                    readOnly
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Street Address
                  </label>
                  <input
                    className={inputClass}
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Postal Code
                  </label>
                  <input
                    className={inputClass}
                    value={formData.postal_code}
                    onChange={(e) =>
                      updateField("postal_code", e.target.value)
                    }
                    placeholder="Postal code"
                  />
                </div>
              </div>
            </section>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                Property Photos
              </h2>

              <p className="mt-1 text-gray-500">
                Add clear photos. The first photo will become the cover image.
              </p>

              <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center transition hover:border-green-500 hover:bg-green-50">
                <span className="text-5xl">📷</span>
                <span className="mt-4 text-lg font-bold text-gray-800">
                  Choose property photos
                </span>
                <span className="mt-1 text-sm text-gray-500">
                  JPG, PNG or WEBP · Maximum 10 photos · 10MB each
                </span>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  onChange={handleImagesChange}
                  className="hidden"
                />
              </label>

              {previewUrls.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {previewUrls.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="overflow-hidden rounded-xl border bg-white"
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="h-36 w-full object-cover"
                      />

                      <div className="p-2">
                        {index === 0 && (
                          <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                            Cover Photo
                          </span>
                        )}

                        <p className="mt-1 truncate text-xs text-gray-500">
                          {item.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                Verification Document
              </h2>

              <p className="mt-1 text-gray-500">
                Upload the official Property Registration Certificate.
              </p>

              <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                <h3 className="font-bold text-yellow-900">
                  Registration certificate required
                </h3>

                <p className="mt-2 text-sm leading-6 text-yellow-800">
                  Enter the official registration number and upload the
                  supporting certificate. Your property will remain under
                  review until an administrator verifies the information.
                </p>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Property Registration ID
                </label>

                <input
                  type="text"
                  className={inputClass}
                  value={formData.property_registration_id}
                  onChange={(e) =>
                    updateField("property_registration_id", e.target.value)
                  }
                  placeholder="Enter the official property registration number"
                  maxLength={255}
                />

                <p className="mt-2 text-sm text-gray-500">
                  Enter the registration number exactly as shown on the official
                  property certificate.
                </p>
              </div>

              <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center hover:border-green-500 hover:bg-green-50">
                <span className="text-5xl">📄</span>
                <span className="mt-4 text-lg font-bold text-gray-800">
                  Upload registration certificate
                </span>
                <span className="mt-1 text-sm text-gray-500">
                  PDF, JPG, PNG or WEBP · Maximum 10MB
                </span>

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleDocumentChange}
                  className="hidden"
                />
              </label>

              {document && (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                  <span className="text-2xl">✓</span>
                  <div>
                    <p className="font-semibold text-green-800">
                      Document selected
                    </p>
                    <p className="text-sm text-green-700">
                      {document.name}
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                Review Your Property
              </h2>

              <p className="mt-1 text-gray-500">
                Check everything carefully before submitting.
              </p>

              <div className="mt-6 space-y-5">
                <div className="rounded-2xl bg-gray-50 p-5">
                  <h3 className="font-bold text-gray-900">
                    Property Details
                  </h3>

                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase text-gray-500">
                        Title
                      </dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {formData.title}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-semibold uppercase text-gray-500">
                        Price
                      </dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {formData.currency} {formData.price}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-semibold uppercase text-gray-500">
                        Property Type
                      </dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {formData.property_type}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-semibold uppercase text-gray-500">
                        Bedrooms / Bathrooms
                      </dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {formData.bedrooms || "—"} / {formData.bathrooms || "—"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4">
                    <dt className="text-xs font-semibold uppercase text-gray-500">
                      Description
                    </dt>
                    <dd className="mt-1 text-gray-700">
                      {formData.description}
                    </dd>
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-5">
                  <h3 className="font-bold text-gray-900">
                    Location
                  </h3>

                  <p className="mt-3 text-gray-700">
                    {formData.address}, {formData.city},{" "}
                    {formData.state_province && `${formData.state_province}, `}
                    {formData.country}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-5">
                  <h3 className="font-bold text-gray-900">
                    Photos & Verification
                  </h3>

                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    <p>✓ {images.length} property photo(s)</p>
                    <p>✓ {document?.name || "Registration certificate selected"}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-800">
                  <strong>Before you submit:</strong> Your property will be
                  created as pending review. It will not become publicly
                  available until an administrator verifies the registration
                  certificate.
                </div>
              </div>
            </section>
          )}

          {/* Navigation */}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={previousStep}
                disabled={submitting}
                className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                ← Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                disabled={submitting}
                className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={loadingLocations || submitting}
                className="rounded-xl bg-green-600 px-7 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingLocations ? "Loading..." : "Continue →"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-green-600 px-7 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Submitting Property..."
                  : "Submit Property for Verification"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
