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
      property_registration_id
    } = req.body;


    const owner_id = req.user.id;


    const result = await pool.query(
      `
      INSERT INTO properties
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
        verification_status,
        property_registration_id
      )

      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,
        'Pending Review',
        $13,
        'pending',
        $14
      )

      RETURNING *
      `,
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
        owner_id,
        property_registration_id
      ]
    );


    res.status(201).json({
      message: "Property submitted for verification",
      property: result.rows[0]
    });


  } catch (error) {

    console.error("createProperty error:", error);

    res.status(500).json({
      error: error.message
    });

  }
};
const getAllProperties = async (req, res) => {
  try {

    const { country } = req.query;

    let query = `
      SELECT 
        p.*,
        pi.image_url AS cover_image
      FROM properties p
      LEFT JOIN property_images pi
        ON pi.property_id = p.id
        AND pi.is_cover = true
      WHERE p.verification_status = 'verified'
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

    console.error("getAllProperties error:", error);

    res.status(500).json({
      error: error.message
    });

  }
};



const getPropertyById = async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        properties.*,
        users.full_name AS owner_name,
        users.email AS owner_email,
        users.phone AS owner_phone
      FROM properties
      JOIN users
      ON properties.owner_id = users.id
      WHERE properties.id = $1
      AND properties.verification_status = 'verified'
      `,
      [id]
    );


    if (result.rows.length === 0) {

      return res.status(404).json({
        message: "Property not found"
      });

    }


    res.json(result.rows[0]);


  } catch(error) {

    console.error("getPropertyById error:", error);

    res.status(500).json({
      error:error.message
    });

  }

};



const getMyProperties = async (req,res)=>{

  try{

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


  }catch(error){

    console.error("getMyProperties error:",error);

    res.status(500).json({
      error:error.message
    });

  }

};
const updateProperty = async (req, res) => {

  try {

    const { id } = req.params;

    const check = await pool.query(
      `SELECT owner_id FROM properties WHERE id = $1`,
      [id]
    );


    if (check.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }


    if (check.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized"
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
      property_type
    } = req.body;


    const result = await pool.query(
      `
      UPDATE properties
      SET
        title=$1,
        description=$2,
        price=$3,
        country=$4,
        state_province=$5,
        city=$6,
        address=$7,
        postal_code=$8,
        currency=$9,
        bedrooms=$10,
        bathrooms=$11,
        property_type=$12,
        status='Pending Review',
        verification_status='pending'
      WHERE id=$13
      RETURNING *
      `,
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
        id
      ]
    );


    res.json({
      message:"Property updated and sent for verification",
      property:result.rows[0]
    });


  } catch(error){

    res.status(500).json({
      error:error.message
    });

  }

};


const deleteProperty = async (req,res)=>{

  try{

    const {id}=req.params;


    await pool.query(
      `DELETE FROM properties WHERE id=$1 AND owner_id=$2`,
      [id,req.user.id]
    );


    res.json({
      message:"Property deleted successfully"
    });


  }catch(error){

    res.status(500).json({
      error:error.message
    });

  }

};

const uploadPropertyImage = async (req, res) => {
  try {

    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "Please upload images"
      });
    }


    const property = await pool.query(
      `
      SELECT owner_id
      FROM properties
      WHERE id=$1
      `,
      [id]
    );


    if (property.rows.length === 0) {
      return res.status(404).json({
        message:"Property not found"
      });
    }


    if (property.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({
        message:"Not authorized"
      });
    }


    for (const file of req.files) {

      await pool.query(
        `
        INSERT INTO property_images
        (
          property_id,
          image_url,
          is_cover
        )
        VALUES
        ($1,$2,false)
        `,
        [
          id,
          file.path
        ]
      );

    }


    res.json({
      message:"Images uploaded successfully"
    });


  } catch(error){

    console.error("uploadPropertyImage error:",error);

    res.status(500).json({
      error:error.message
    });

  }
};



const getPropertyImages = async (req,res)=>{

  try{

    const {id}=req.params;


    const result = await pool.query(
      `
      SELECT
        id,
        image_url,
        is_cover,
        uploaded_at
      FROM property_images
      WHERE property_id=$1
      ORDER BY uploaded_at ASC
      `,
      [id]
    );


    res.json(result.rows);


  }catch(error){

    res.status(500).json({
      error:error.message
    });

  }

};



const setCoverImage = async(req,res)=>{

  try{

    const {id,imageId}=req.params;


    await pool.query(
      `
      UPDATE property_images
      SET is_cover=false
      WHERE property_id=$1
      `,
      [id]
    );


    const result = await pool.query(
      `
      UPDATE property_images
      SET is_cover=true
      WHERE id=$1
      AND property_id=$2
      RETURNING *
      `,
      [
        imageId,
        id
      ]
    );


    if(result.rows.length===0){

      return res.status(404).json({
        message:"Image not found"
      });

    }


    res.json({
      message:"Cover image updated",
      image:result.rows[0]
    });


  }catch(error){

    res.status(500).json({
      error:error.message
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
