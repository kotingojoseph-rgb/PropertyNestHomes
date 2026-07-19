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
  owner_id,
  verification_status
)
VALUES
($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
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
  owner_id,
  "pending"
]
    );

    res.status(201).json({
      message: "Property created successfully",
      property: result.rows[0]
    });

  } catch (error) {
  console.error("getPropertyById error:", error);

  res.status(500).json({
    error: error.message
  });
}

};

const getAllProperties = async (req, res) => {
  try {
    const { country } = req.query;

    let query = `
  SELECT *
  FROM properties
  WHERE verification_status = 'verified'
`;

let values = [];

if (country) {
  query += ` AND country = $1`;
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
 WHERE id = $1
 AND verification_status = 'verified'`,
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

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "Please upload at least one image."
      });
    }

// Verify the property exists
const propertyResult = await pool.query(
  `SELECT owner_id
   FROM properties
   WHERE id = $1`,
  [id]
);

if (propertyResult.rows.length === 0) {
  return res.status(404).json({
    message: "Property not found"
  });
}

// Verify the logged-in user owns the property
if (propertyResult.rows[0].owner_id !== req.user.id) {
  return res.status(403).json({
    message: "You are not authorized to upload images to this property."
  });
}

 for (const file of req.files) {
  await pool.query(
    `INSERT INTO property_images
    (property_id, image_url, is_cover)
    VALUES ($1, $2, $3)`,
    [
      id,
      file.path,
      false
    ]
  );
}

res.status(201).json({
  message: "Images uploaded successfully.",
  uploadedImages: req.files.map(file => ({
    filename: file.filename,
    url: file.path
  }))
});

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Image upload failed",
      error: error.message
    });
  }
};

const setCoverImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    // Verify the property exists
    const propertyResult = await pool.query(
      `SELECT id, owner_id
       FROM properties
       WHERE id = $1`,
      [id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }

    // Verify the logged-in user owns the property
    if (propertyResult.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to modify this property."
      });
    }

    // Remove the current cover image
    await pool.query(
      `UPDATE property_images
       SET is_cover = false
       WHERE property_id = $1`,
      [id]
    );

    // Set the selected image as the cover
    const result = await pool.query(
      `UPDATE property_images
       SET is_cover = true
       WHERE id = $1
       AND property_id = $2
       RETURNING *`,
      [imageId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Image not found"
      });
    }

    res.json({
      message: "Cover image updated successfully.",
      coverImage: result.rows[0]
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
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
  image_url: image.image_url,
}));

res.json(images);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not fetch property images"
    });
  }
};

const getMyProperties = async (req, res) => {
  try {
    const owner_id = req.user.id;

    const result = await pool.query(
      `
      SELECT
  p.*,
  pi.image_url
FROM properties p
LEFT JOIN property_images pi
  ON pi.property_id = p.id
  AND pi.is_cover = true
WHERE p.owner_id = $1
ORDER BY p.created_at DESC
      `,
      [owner_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
};



module.exports = {
  createProperty,
  getAllProperties,
  getPropertyById,
  getMyProperties,
  updateProperty,
  deleteProperty,
  uploadPropertyImage,
  getPropertyImages,
  setCoverImage
};
