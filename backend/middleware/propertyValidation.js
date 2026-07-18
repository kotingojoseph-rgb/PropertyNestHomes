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
    status,
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
    (!Number.isInteger(Number(bedrooms)) || Number(bedrooms) < 0)
  ) {
    return res.status(400).json({
      error: "Bedrooms must be a non-negative whole number.",
    });
  }

  // Bathrooms
  if (
    bathrooms !== undefined &&
    (!Number.isInteger(Number(bathrooms)) || Number(bathrooms) < 0)
  ) {
    return res.status(400).json({
      error: "Bathrooms must be a non-negative whole number.",
    });
  }

  // Required text fields
  if (!country || !city || !currency) {
    return res.status(400).json({
      error: "Country, city and currency are required.",
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
  ];

  if (!allowedTypes.includes(property_type)) {
    return res.status(400).json({
      error: "Invalid property type.",
    });
  }

  // Allowed status values
  const allowedStatus = [
    "Sale",
    "Rent",
    "Sold",
  ];

  if (!allowedStatus.includes(status)) {
    return res.status(400).json({
      error: "Invalid property status.",
    });
  }

  next();
};
