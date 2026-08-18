const pool = require("../config/db");
const { getIO } = require("../socket");
const cloudinary = require("../config/cloudinary");

// ============================================================
// CREATE OR GET CONVERSATION
// Supports:
// 1. Existing property-based conversations
// 2. Direct user-to-user conversations
// ============================================================
exports.createConversation = async (req, res) => {
  try {
    const {
      property_id = null,
      seller_id,
    } = req.body;

    const buyer_id = req.user.id;

    if (!seller_id) {
      return res.status(400).json({
        error: "seller_id is required",
      });
    }

    if (Number(seller_id) === Number(buyer_id)) {
      return res.status(400).json({
        error: "You cannot start a conversation with yourself",
      });
    }

    // Verify other user exists
    const userCheck = await pool.query(
      `
      SELECT id
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [seller_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // ----------------------------------------------------------
    // DIRECT USER-TO-USER CHAT
    // ----------------------------------------------------------
    if (property_id === null) {
      const existing = await pool.query(
        `
        SELECT *
        FROM conversations
        WHERE property_id IS NULL
        AND (
          (buyer_id = $1 AND seller_id = $2)
          OR
          (buyer_id = $2 AND seller_id = $1)
        )
        ORDER BY id ASC
        LIMIT 1
        `,
        [buyer_id, seller_id]
      );

      if (existing.rows.length > 0) {
        return res.json(existing.rows[0]);
      }

      const result = await pool.query(
        `
        INSERT INTO conversations
        (
          property_id,
          buyer_id,
          seller_id
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [null, buyer_id, seller_id]
      );

      return res.json(result.rows[0]);
    }

    // ----------------------------------------------------------
    // EXISTING PROPERTY CHAT
    // ----------------------------------------------------------
    const result = await pool.query(
      `
      INSERT INTO conversations
      (
        property_id,
        buyer_id,
        seller_id
      )
      VALUES ($1, $2, $3)

      ON CONFLICT(property_id, buyer_id, seller_id)
      DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP

      RETURNING *
      `,
      [
        property_id,
        buyer_id,
        seller_id,
      ]
    );

    return res.json(result.rows[0]);

  } catch (error) {
    console.error(
      "Create conversation error:",
      error
    );

    return res.status(500).json({
      error: error.message,
    });
  }
};


// ============================================================
// SEND TEXT MESSAGE
// ============================================================
exports.sendMessage = async (req, res) => {
  try {
    const {
      conversation_id,
      message,
    } = req.body;

    const sender_id = req.user.id;

    if (!conversation_id) {
      return res.status(400).json({
        error: "conversation_id is required",
      });
    }

    if (
      !message ||
      !String(message).trim()
    ) {
      return res.status(400).json({
        error: "Message cannot be empty",
      });
    }

    // Verify user belongs to conversation
    const access = await pool.query(
      `
      SELECT id
      FROM conversations
      WHERE id = $1
      AND (
        buyer_id = $2
        OR seller_id = $2
      )
      LIMIT 1
      `,
      [
        conversation_id,
        sender_id,
      ]
    );

    if (access.rows.length === 0) {
      return res.status(403).json({
        error: "Access denied to conversation",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO messages
      (
        conversation_id,
        sender_id,
        message,
        media_type
      )
      VALUES ($1, $2, $3, 'text')
      RETURNING *
      `,
      [
        conversation_id,
        sender_id,
        String(message).trim(),
      ]
    );

    const newMessage =
      result.rows[0];

    // Update conversation timestamps
    await pool.query(
      `
      UPDATE conversations
      SET
        updated_at = CURRENT_TIMESTAMP,
        last_message_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [conversation_id]
    );

    // Real-time delivery
const io = getIO();

io.to(`conversation_${conversation_id}`).emit(
  "newMessage",
  newMessage
);

// Also notify both participants directly.
// This makes delivery reliable even if one client has
// not joined the conversation room yet.
const conversationUsers = await pool.query(
  `
  SELECT buyer_id, seller_id
  FROM conversations
  WHERE id = $1
  LIMIT 1
  `,
  [conversation_id]
);

if (conversationUsers.rows.length > 0) {
  const { buyer_id, seller_id } =
    conversationUsers.rows[0];

  io.to(`user_${buyer_id}`).emit(
    "conversationUpdated",
    newMessage
  );

  io.to(`user_${seller_id}`).emit(
    "conversationUpdated",
    newMessage
  );
}

    return res.json(newMessage);

  } catch (error) {
    console.error(
      "Send message error:",
      error
    );

    return res.status(500).json({
      error: error.message,
    });
  }
};


// ============================================================
// GET CONVERSATION MESSAGES
// ============================================================
exports.getMessages = async (req, res) => {
  try {
    const {
      conversation_id,
    } = req.params;

    const user_id = req.user.id;

    const result = await pool.query(
      `
      SELECT
        messages.*,
        users.full_name

      FROM messages

      JOIN users
        ON users.id = messages.sender_id

      JOIN conversations
        ON conversations.id =
           messages.conversation_id

      WHERE
        messages.conversation_id = $1

      AND (
        conversations.buyer_id = $2
        OR conversations.seller_id = $2
      )

      ORDER BY messages.created_at ASC
      `,
      [
        conversation_id,
        user_id,
      ]
    );

    return res.json(result.rows);

  } catch (error) {
    console.error(
      "Get messages error:",
      error
    );

    return res.status(500).json({
      error: error.message,
    });
  }
};


// ============================================================
// GET USER CONVERSATIONS
// ============================================================
exports.getConversations = async (
  req,
  res
) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `
      SELECT
        conversations.id,
        conversations.property_id,
        conversations.created_at,
        conversations.updated_at,
        conversations.last_message_at,

        properties.title,
        properties.image,

        buyer.full_name AS buyer_name,
        seller.full_name AS seller_name,

        CASE
          WHEN conversations.buyer_id = $1
          THEN seller.full_name
          ELSE buyer.full_name
        END AS other_user_name,

        CASE
          WHEN conversations.buyer_id = $1
          THEN seller.id
          ELSE buyer.id
        END AS other_user_id,

        messages.message AS last_message,
        messages.created_at AS last_message_time,
        messages.media_type AS last_message_type

      FROM conversations

      LEFT JOIN properties
        ON properties.id =
           conversations.property_id

      JOIN users buyer
        ON buyer.id =
           conversations.buyer_id

      JOIN users seller
        ON seller.id =
           conversations.seller_id

      LEFT JOIN messages
        ON messages.id = (
          SELECT id
          FROM messages
          WHERE conversation_id =
                conversations.id
          ORDER BY created_at DESC
          LIMIT 1
        )

      WHERE
        conversations.buyer_id = $1
        OR conversations.seller_id = $1

      ORDER BY COALESCE(
        conversations.last_message_at,
        conversations.updated_at,
        conversations.created_at
      ) DESC
      `,
      [user_id]
    );

    return res.json(result.rows);

  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    return res.status(500).json({
      error: error.message,
    });
  }
};


// ============================================================
// GET CONVERSATION DETAILS
// ============================================================
exports.getConversationDetails = async (
  req,
  res
) => {
  try {
    const {
      conversation_id,
    } = req.params;

    const userId = req.user.id;

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.property_id,
        c.buyer_id,
        c.seller_id,

        buyer.full_name AS buyer_name,
        seller.full_name AS seller_name,

        CASE
          WHEN c.buyer_id = $2
          THEN c.seller_id
          ELSE c.buyer_id
        END AS other_user_id,

        CASE
          WHEN c.buyer_id = $2
          THEN seller.full_name
          ELSE buyer.full_name
        END AS other_user_name,

        CASE
          WHEN c.buyer_id = $2
          THEN seller.email
          ELSE buyer.email
        END AS other_user_email

      FROM conversations c

      JOIN users buyer
        ON buyer.id = c.buyer_id

      JOIN users seller
        ON seller.id = c.seller_id

      WHERE c.id = $1

      AND (
        c.buyer_id = $2
        OR c.seller_id = $2
      )
      `,
      [
        conversation_id,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error:
          "Conversation not found",
      });
    }

    return res.json(
      result.rows[0]
    );

  } catch (error) {
    console.error(
      "Conversation details error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to load conversation",
    });
  }
};


// ============================================================
// GET PEOPLE
// ============================================================
exports.getPeople = async (
  req,
  res
) => {
  try {
    const search = String(
      req.query.search || ""
    ).trim();

    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        phone
      FROM users

      WHERE id <> $1

      AND (
        $2 = ''
        OR full_name ILIKE
           '%' || $2 || '%'
        OR email ILIKE
           '%' || $2 || '%'
      )

      ORDER BY full_name ASC
      LIMIT 50
      `,
      [
        req.user.id,
        search,
      ]
    );

    return res.json(
      result.rows
    );

  } catch (error) {
    console.error(
      "Get people error:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to load people",
    });
  }
};


// ============================================================
// UPLOAD VOICE NOTE / VIDEO MESSAGE
// ============================================================
exports.uploadChatMedia = async (
  req,
  res
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error:
          "No media file uploaded",
      });
    }

    const {
      conversation_id,
      media_type,
    } = req.body;

    if (!conversation_id) {
      return res.status(400).json({
        error:
          "conversation_id is required",
      });
    }

    if (
      !["audio", "video"].includes(
        media_type
      )
    ) {
      return res.status(400).json({
        error:
          "media_type must be audio or video",
      });
    }

    // Verify conversation access
    const access = await pool.query(
      `
      SELECT id
      FROM conversations
      WHERE id = $1
      AND (
        buyer_id = $2
        OR seller_id = $2
      )
      LIMIT 1
      `,
      [
        conversation_id,
        req.user.id,
      ]
    );

    if (access.rows.length === 0) {
      return res.status(403).json({
        error:
          "Access denied to conversation",
      });
    }

    /*
     * Cloudinary uses resource_type "video"
     * for audio/video media.
     */
    const folder =
      media_type === "audio"
        ? "propertynesthomes/chat/audio"
        : "propertynesthomes/chat/video";

    const uploadResult =
      await new Promise(
        (resolve, reject) => {
          const stream =
            cloudinary.uploader.upload_stream(
              {
                folder,
                resource_type:
                  "video",
              },
              (
                error,
                result
              ) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );

          stream.end(
            req.file.buffer
          );
        }
      );

    const audioUrl =
      media_type === "audio"
        ? uploadResult.secure_url
        : null;

    const videoUrl =
      media_type === "video"
        ? uploadResult.secure_url
        : null;

    const label =
      media_type === "audio"
        ? "🎤 Voice message"
        : "🎥 Video message";

    const result = await pool.query(
      `
      INSERT INTO messages
      (
        conversation_id,
        sender_id,
        message,
        audio_url,
        video_url,
        media_type
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
      )
      RETURNING *
      `,
      [
        conversation_id,
        req.user.id,
        label,
        audioUrl,
        videoUrl,
        media_type,
      ]
    );

    const newMessage =
      result.rows[0];

    await pool.query(
      `
      UPDATE conversations
      SET
        updated_at =
          CURRENT_TIMESTAMP,
        last_message_at =
          CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [conversation_id]
    );

    getIO()
      .to(`conversation_${conversation_id}`)
      .emit(
        "newMessage",
        newMessage
      );

    return res.json(
      newMessage
    );

  } catch (error) {
    console.error(
      "Chat media upload error:",
      error
    );

    return res.status(500).json({
      error: error.message || "Media upload failed",
    });
  }
};
