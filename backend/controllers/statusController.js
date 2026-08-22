const pool = require("../config/db");
const cloudinary = require("../config/cloudinary");
const { getIO } = require("../socket");

/*
 * Remove expired statuses before returning results.
 */
async function cleanupExpiredStatuses() {
  await pool.query(`
    DELETE FROM statuses
    WHERE expires_at <= NOW()
  `);
}


/*
 * Upload status image/video to Cloudinary.
 */
async function uploadStatusMedia(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No media file uploaded",
      });
    }

    const mimeType = String(
      req.file.mimetype || ""
    ).toLowerCase();

    const mediaType = mimeType.startsWith("video/")
      ? "video"
      : mimeType.startsWith("image/")
      ? "image"
      : null;

    if (!mediaType) {
      return res.status(400).json({
        error: "Only image and video status media are supported",
      });
    }

    const resourceType =
      mediaType === "video"
        ? "video"
        : "image";

    const folder =
      mediaType === "video"
        ? "propertynesthomes/status/video"
        : "propertynesthomes/status/image";

    const uploadResult = await new Promise(
      (resolve, reject) => {
        const stream =
          cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: resourceType,
            },
            (error, result) => {
              if (error) {
                return reject(error);
              }

              resolve(result);
            }
          );

        stream.end(req.file.buffer);
      }
    );

    return res.status(201).json({
      success: true,
      media: {
        url: uploadResult.secure_url,
        media_url: uploadResult.secure_url,
        media_type: mediaType,
        public_id: uploadResult.public_id,
        resource_type: uploadResult.resource_type,
      },
    });
  } catch (error) {
    console.error(
      "uploadStatusMedia error:",
      error
    );

    return res.status(500).json({
      error: "Failed to upload status media",
    });
  }
}

/*
 * Create a new status.
 *
 * Supports:
 *   text
 *   image
 *   video
 */
async function createStatus(req, res) {
  try {
    const userId = req.user.id;

    const {
      caption = "",
      media_url = null,
      media_type = "text",
    } = req.body;

    const allowedTypes = ["text", "image", "video"];

    if (!allowedTypes.includes(media_type)) {
      return res.status(400).json({
        error: "Invalid status media type",
      });
    }

    if (
      media_type === "text" &&
      !String(caption).trim()
    ) {
      return res.status(400).json({
        error: "Text status cannot be empty",
      });
    }

    if (
      media_type !== "text" &&
      !media_url
    ) {
      return res.status(400).json({
        error: "Media URL is required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO statuses
        (
          user_id,
          media_url,
          media_type,
          caption
        )
      VALUES
        ($1, $2, $3, $4)
      RETURNING
        id,
        user_id,
        media_url,
        media_type,
        caption,
        created_at,
        expires_at
      `,
      [
        userId,
        media_url,
        media_type,
        String(caption || "").trim(),
      ]
    );

    const status = result.rows[0];

    /*
     * Notify connected users through Socket.IO
     * when available.
     */
    try {
      const io = getIO();

      io.emit("newStatus", {
        statusId: status.id,
        userId: status.user_id,
        mediaType: status.media_type,
        createdAt: status.created_at,
      });
    } catch (socketError) {
      console.error(
        "Status socket notification error:",
        socketError.message
      );
    }

    return res.status(201).json({
      success: true,
      status,
    });
  } catch (error) {
    console.error(
      "createStatus error:",
      error
    );

    return res.status(500).json({
      error: "Failed to create status",
    });
  }
}

/*
 * Get active statuses grouped by user.
 *
 * Returns only statuses that have not expired.
 */
async function getStatuses(req, res) {
  try {
    const viewerId = req.user.id;

    await cleanupExpiredStatuses();

    const result = await pool.query(
      `
      SELECT
        s.id,
        s.user_id,
        s.media_url,
        s.media_type,
        s.caption,
        s.created_at,
        s.expires_at,

        u.full_name,
        u.email,

        CASE
          WHEN sv.id IS NULL THEN false
          ELSE true
        END AS viewed

      FROM statuses s

      JOIN users u
        ON u.id = s.user_id

      LEFT JOIN status_views sv
        ON sv.status_id = s.id
       AND sv.viewer_id = $1

      WHERE s.expires_at > NOW()

      ORDER BY
        s.created_at ASC
      `,
      [viewerId]
    );

    const grouped = {};

    for (const row of result.rows) {
      if (!grouped[row.user_id]) {
        grouped[row.user_id] = {
          user: {
            id: row.user_id,
            full_name: row.full_name,
            email: row.email,
          },
          statuses: [],
          has_unviewed: false,
        };
      }

      grouped[row.user_id].statuses.push({
        id: row.id,
        media_url: row.media_url,
        media_type: row.media_type,
        caption: row.caption,
        created_at: row.created_at,
        expires_at: row.expires_at,
        viewed: row.viewed,
      });

      if (!row.viewed) {
        grouped[row.user_id].has_unviewed = true;
      }
    }

    return res.json({
      success: true,
      statuses: Object.values(grouped),
    });
  } catch (error) {
    console.error(
      "getStatuses error:",
      error
    );

    return res.status(500).json({
      error: "Failed to load statuses",
      details: error.message,
      code: error.code,
    });
  }
}

/*
 * Mark a status as viewed.
 */
async function viewStatus(req, res) {
  try {
    const viewerId = req.user.id;
    const statusId = Number(req.params.status_id);

    if (!Number.isInteger(statusId)) {
      return res.status(400).json({
        error: "Invalid status ID",
      });
    }

    const statusResult = await pool.query(
      `
      SELECT id
      FROM statuses
      WHERE id = $1
        AND expires_at > NOW()
      `,
      [statusId]
    );

    if (!statusResult.rows.length) {
      return res.status(404).json({
        error: "Status not found or expired",
      });
    }

    await pool.query(
      `
      INSERT INTO status_views
        (
          status_id,
          viewer_id
        )
      VALUES
        ($1, $2)

      ON CONFLICT
        (status_id, viewer_id)

      DO UPDATE SET
        viewed_at = NOW()
      `,
      [
        statusId,
        viewerId,
      ]
    );

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "viewStatus error:",
      error
    );

    return res.status(500).json({
      error: "Failed to mark status as viewed",
    });
  }
}

/*
 * Get viewers for the current user's statuses.
 */
async function getStatusViewers(req, res) {
  try {
    const userId = req.user.id;

    await cleanupExpiredStatuses();

    const result = await pool.query(
      `
      SELECT
        s.id AS status_id,
        s.caption,
        s.media_type,
        s.created_at,

        u.id AS viewer_id,
        u.full_name,
        u.email,

        sv.viewed_at

      FROM statuses s

      JOIN status_views sv
        ON sv.status_id = s.id

      JOIN users u
        ON u.id = sv.viewer_id

      WHERE s.user_id = $1
        AND s.expires_at > NOW()

      ORDER BY sv.viewed_at DESC
      `,
      [userId]
    );

    return res.json({
      success: true,
      viewers: result.rows,
    });
  } catch (error) {
    console.error(
      "getStatusViewers error:",
      error
    );

    return res.status(500).json({
      error: "Failed to load status viewers",
    });
  }
}

module.exports = {
  createStatus,
  uploadStatusMedia,
  getStatuses,
  viewStatus,
  getStatusViewers,
};
