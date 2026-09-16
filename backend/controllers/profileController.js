const pool = require("../config/db");

exports.updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please select an image.",
      });
    }

    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

    if (!allowedTypes.has(req.file.mimetype)) {
      return res.status(400).json({
        error: "Only JPG, PNG and WebP images are allowed.",
      });
    }

    const imageUrl =
      req.file.secure_url ||
      req.file.path;

    if (!imageUrl) {
      return res.status(500).json({
        error: "Image upload failed.",
      });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET profile_image_url = $1
      WHERE id = $2
      RETURNING
        id,
        full_name,
        email,
        role,
        profile_image_url
      `,
      [imageUrl, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    return res.json({
      message: "Profile picture updated.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Update profile image error:", error);

    return res.status(500).json({
      error: "Unable to update profile picture.",
    });
  }
};
