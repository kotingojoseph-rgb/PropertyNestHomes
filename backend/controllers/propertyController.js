const pool = require("../config/db");

const createProperty = async (req, res) => {
  try {
    const {
  title,
  description,
  price,
  country,
  state_province,
  city,
  address,
  postal_code,
  currency,
  bedrooms,
  bathrooms,
  property_type,
  status
} = req.body;

    const owner_id = req.user.id;

    const result = await pool.query(
      `INSERT INTO properties
     (
  title,
  description,
  price,
  country,
  state_province,
  city,
  address,
  postal_code,
  currency,
  bedrooms,
  bathrooms,
  property_type,
  status,
  owner_id
)
VALUES
($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
RETURNING *`,
      [
  title,
  description,
  price,
  country,
  state_province,
  city,
  address,
  postal_code,
  currency,
  bedrooms,
  bathrooms,
  property_type,
  status,
  owner_id
]
    );

    res.status(201).json({
      message: "Property created successfully",
      property: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

const getAllProperties = async (req, res) => {
  try {
    const { country } = req.query;

    let query = `SELECT * FROM properties`;
    let values = [];

    if (country) {
      query += ` WHERE country = $1`;
      values.push(country);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


const getPropertyById = async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM properties
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({
      error: error.message
  });
}

};


const updateProperty = async (req, res) => {
 
 try {

    const { id } = req.params;

    // Check if the property exists
    const propertyResult = await pool.query(
      `SELECT * FROM properties WHERE id = $1`,
      [id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }

    // Check ownership
    if (propertyResult.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to update this property"
      });
    }

    const {
      title,
      description,
      price,
      country,
      state_province,
      city,
      address,
      postal_code,
      currency,
      bedrooms,
      bathrooms,
      property_type,
      status
    } = req.body;

    const result = await pool.query(
      `UPDATE properties
       SET
         title = $1,
         description = $2,
         price = $3,
         country = $4,
         state_province = $5,
         city = $6,
         address = $7,
         postal_code = $8,
         currency = $9,
         bedrooms = $10,
         bathrooms = $11,
         property_type = $12,
         status = $13
       WHERE id = $14
       RETURNING *`,
      [
        title,
        description,
        price,
        country,
        state_province,
        city,
        address,
        postal_code,
        currency,
        bedrooms,
        bathrooms,
        property_type,
        status,
        id
      ]
    );

    res.json({
      message: "Property updated successfully",
      property: result.rows[0]
    });

    } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if property exists
    const propertyResult = await pool.query(
      `SELECT * FROM properties WHERE id = $1`,
      [id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }

    // Check ownership
    if (propertyResult.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to delete this property"
      });
    }

    await pool.query(
      `DELETE FROM properties WHERE id = $1`,
      [id]
    );

    res.json({
      message: "Property deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }

};

const uploadPropertyImage = async (req, res) => {
  try {
    const { id } = req.params;

console.log("Uploading image for property:", id);
console.log("Filename:", req.file.filename);


    await pool.query(
      `INSERT INTO property_images
      (property_id, image_url, is_cover)
      VALUES ($1, $2, $3)`,
      [
        id,
        req.file.filename,
        false
      ]
    );
console.log("Database insert successful!");


    res.json({
      message: "Image uploaded successfully!",
      filename: req.file.filename
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Image upload failed",
      error: error.message
    });
  }
};

const getPropertyImages = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        id,
        image_url,
        is_cover,
        uploaded_at
      FROM property_images
      WHERE property_id = $1
      ORDER BY uploaded_at ASC`,
      [id]
    );

    const images = result.rows.map(image => ({
  ...image,
  image_url: `http://localhost:5000/uploads/${image.image_url}`
}));

res.json(images);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not fetch property images"
    });
  }
};

module.exports = {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  uploadPropertyImage,
  getPropertyImages
};
