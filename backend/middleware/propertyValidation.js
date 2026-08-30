module.exports = (req, res, next) => {
  const {
    title,
    description,
    price,
    country,
    city,
    currency,
    bedrooms,
    bathrooms,
    property_type,
    property_registration_id,
  } = req.body;

  // Title
  if (!title || title.trim().length < 5 || title.trim().length > 120) {
    return res.status(400).json({
      error: "Title must be between 5 and 120 characters.",
    });
  }

  // Description
  if (!description || description.trim().length < 20) {
    return res.status(400).json({
      error: "Description must be at least 20 characters.",
    });
  }

  // Price
  if (isNaN(price) || Number(price) <= 0) {
    return res.status(400).json({
      error: "Price must be greater than zero.",
    });
  }

  // Bedrooms
  if (
    bedrooms !== undefined &&
    bedrooms !== "" &&
    (!Number.isInteger(Number(bedrooms)) || Number(bedrooms) < 0)
  ) {
    return res.status(400).json({
      error: "Bedrooms must be a non-negative whole number.",
    });
  }

  // Bathrooms
  if (
    bathrooms !== undefined &&
    bathrooms !== "" &&
    (!Number.isInteger(Number(bathrooms)) || Number(bathrooms) < 0)
  ) {
    return res.status(400).json({
      error: "Bathrooms must be a non-negative whole number.",
    });
  }

  // Required location/currency fields
  if (!country || !city || !currency) {
    return res.status(400).json({
      error: "Country, city and currency are required.",
    });
  }

  // Property Registration ID
  if (
    !property_registration_id ||
    typeof property_registration_id !== "string" ||
    !property_registration_id.trim()
  ) {
    return res.status(400).json({
      error: "Property Registration ID is required.",
    });
  }

  if (property_registration_id.trim().length > 255) {
    return res.status(400).json({
      error: "Property Registration ID must be 255 characters or fewer.",
    });
  }

  // Allowed property types
  const allowedTypes = [
    "House",
    "Apartment",
    "Land",
    "Commercial",
    "Villa",
    "Office",
    "Duplex",
    "Condo",
    "Penthouse",
  ];

  if (!allowedTypes.includes(property_type)) {
    return res.status(400).json({
      error: "Invalid property type.",
    });
  }

  /*
   * Do not validate `status` here.
   *
   * New properties are automatically created by the controller
   * with:
   *
   * status = 'Pending Review'
   * verification_status = 'pending'
   *
   * The administrator controls verification.
   */

  next();
};
