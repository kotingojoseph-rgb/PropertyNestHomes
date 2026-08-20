const pool = require("../config/db");
const { getIO } = require("../socket");
const cloudinary = require("../config/cloudinary");

// ============================================================
// MESSAGE HELPERS
// ============================================================

/*
 * Load a message together with the message it replies to.
 *
 * We keep the original message fields under `reply_to` so the
 * frontend can render a WhatsApp-style quoted message.
 */
async function getMessageWithReply(messageId) {
  const result = await pool.query(
    `
    SELECT
      m.*,

      u.full_name,

      rm.id AS reply_to_id,
      rm.message AS reply_to_message,
      rm.sender_id AS reply_to_sender_id,
      rm.media_type AS reply_to_media_type,
      rm.audio_url AS reply_to_audio_url,
      rm.video_url AS reply_to_video_url,
      rm.created_at AS reply_to_created_at,

      ru.full_name AS reply_to_sender_name

    FROM messages m

    JOIN users u
      ON u.id = m.sender_id

    LEFT JOIN messages rm
      ON rm.id = m.reply_to_message_id

    LEFT JOIN users ru
      ON ru.id = rm.sender_id

    WHERE m.id = $1
    LIMIT 1
    `,
    [messageId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];

  return {
    ...row,

    reply_to: row.reply_to_id
      ? {
          id: Number(row.reply_to_id),
          message: row.reply_to_message || "",
          sender_id: Number(row.reply_to_sender_id),
          sender_name:
            row.reply_to_sender_name ||
            "PropertyNestHomes User",
          media_type:
            row.reply_to_media_type || "text",
          audio_url:
            row.reply_to_audio_url || null,
          video_url:
            row.reply_to_video_url || null,
          created_at:
            row.reply_to_created_at || null,
        }
      : null,
  };
}


/*
 * Validate a reply target.
 *
 * A user may only reply to a message that belongs to the same
 * conversation they are currently messaging in.
 */
async function validateReplyTarget(
  conversationId,
  replyToMessageId
) {
  if (
    replyToMessageId === null ||
    replyToMessageId === undefined ||
    replyToMessageId === ""
  ) {
    return null;
  }

  const numericReplyId =
    Number(replyToMessageId);

  if (
    !Number.isInteger(numericReplyId) ||
    numericReplyId <= 0
  ) {
    const error = new Error(
      "Invalid reply_to_message_id"
    );

    error.status = 400;

    throw error;
  }

  const result = await pool.query(
    `
    SELECT
      id,
      conversation_id
    FROM messages
    WHERE id = $1
    AND conversation_id = $2
    LIMIT 1
    `,
    [
      numericReplyId,
      conversationId,
    ]
  );

  if (result.rows.length === 0) {
    const error = new Error(
      "The message you are replying to was not found in this conversation."
    );

    error.status = 400;

    throw error;
  }

  return numericReplyId;
}


/*
 * Send the global notification and conversation update for a
 * newly created message.
 */
async function notifyParticipants(
  conversationId,
  senderId,
  newMessage
) {
  const io = getIO();

  const conversationUsers =
    await pool.query(
      `
      SELECT
        conversations.buyer_id,
        conversations.seller_id,

        buyer.full_name AS buyer_name,
        seller.full_name AS seller_name

      FROM conversations

      JOIN users buyer
        ON buyer.id =
           conversations.buyer_id

      JOIN users seller
        ON seller.id =
           conversations.seller_id

      WHERE conversations.id = $1

      LIMIT 1
      `,
      [conversationId]
    );

  if (
    conversationUsers.rows.length === 0
  ) {
    return;
  }

  const {
    buyer_id,
    seller_id,
    buyer_name,
    seller_name,
  } = conversationUsers.rows[0];

  const senderName =
    Number(senderId) === Number(buyer_id)
      ? buyer_name ||
        "PropertyNestHomes User"
      : seller_name ||
        "PropertyNestHomes User";

  const notification = {
    messageId: Number(newMessage.id),

    conversationId:
      Number(conversationId),

    senderId: Number(senderId),

    senderName,

    message:
      newMessage.message || "",

    mediaType:
      newMessage.media_type || "text",

    createdAt:
      newMessage.created_at,

    replyToMessageId:
      newMessage.reply_to_message_id
        ? Number(
            newMessage.reply_to_message_id
          )
        : null,

    replyTo:
      newMessage.reply_to || null,
  };

  const participantIds = [
    Number(buyer_id),
    Number(seller_id),
  ];

  // ----------------------------------------------------------
  // GLOBAL USER NOTIFICATION
  // ----------------------------------------------------------

  for (
    const participantId
    of participantIds
  ) {
    io.to(
      `user_${participantId}`
    ).emit(
      "newMessageNotification",
      notification
    );
  }

  // ----------------------------------------------------------
  // CONVERSATION LIST UPDATE
  // ----------------------------------------------------------

  for (
    const participantId
    of participantIds
  ) {
    io.to(
      `user_${participantId}`
    ).emit(
      "conversationUpdated",
      newMessage
    );
  }
}


// ============================================================
// CREATE OR GET CONVERSATION
// Supports:
// 1. Existing property-based conversations
// 2. Direct user-to-user conversations
// ============================================================

exports.createConversation = async (
  req,
  res
) => {
  try {
    const {
      property_id = null,
      seller_id,
    } = req.body;

    const buyer_id =
      req.user.id;

    if (!seller_id) {
      return res.status(400).json({
        error:
          "seller_id is required",
      });
    }

    if (
      Number(seller_id) ===
      Number(buyer_id)
    ) {
      return res.status(400).json({
        error:
          "You cannot start a conversation with yourself",
      });
    }

    // Verify other user exists
    const userCheck =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [seller_id]
      );

    if (
      userCheck.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "User not found",
      });
    }

    // ----------------------------------------------------------
    // DIRECT USER-TO-USER CHAT
    // ----------------------------------------------------------

    if (property_id === null) {
      const existing =
        await pool.query(
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
          [
            buyer_id,
            seller_id,
          ]
        );

      if (
        existing.rows.length > 0
      ) {
        return res.json(
          existing.rows[0]
        );
      }

      const result =
        await pool.query(
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
          [
            null,
            buyer_id,
            seller_id,
          ]
        );

      return res.json(
        result.rows[0]
      );
    }

    // ----------------------------------------------------------
    // EXISTING PROPERTY CHAT
    // ----------------------------------------------------------

    const result =
      await pool.query(
        `
        INSERT INTO conversations
        (
          property_id,
          buyer_id,
          seller_id
        )
        VALUES ($1, $2, $3)

        ON CONFLICT(
          property_id,
          buyer_id,
          seller_id
        )
        DO UPDATE SET
          updated_at =
            CURRENT_TIMESTAMP

        RETURNING *
        `,
        [
          property_id,
          buyer_id,
          seller_id,
        ]
      );

    return res.json(
      result.rows[0]
    );

  } catch (error) {
    console.error(
      "Create conversation error:",
      error
    );

    return res.status(500).json({
      error:
        error.message,
    });
  }
};


// ============================================================
// SEND TEXT MESSAGE
// ============================================================

exports.sendMessage = async (
  req,
  res
) => {
  try {
    const {
      conversation_id,
      message,
      reply_to_message_id,
    } = req.body;

    const sender_id =
      req.user.id;

    if (!conversation_id) {
      return res.status(400).json({
        error:
          "conversation_id is required",
      });
    }

    if (
      !message ||
      !String(message).trim()
    ) {
      return res.status(400).json({
        error:
          "Message cannot be empty",
      });
    }

    // ----------------------------------------------------------
    // VERIFY USER BELONGS TO CONVERSATION
    // ----------------------------------------------------------

    const access =
      await pool.query(
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

    if (
      access.rows.length === 0
    ) {
      return res.status(403).json({
        error:
          "Access denied to conversation",
      });
    }

    // ----------------------------------------------------------
    // VALIDATE REPLY TARGET
    // ----------------------------------------------------------

    const replyToId =
      await validateReplyTarget(
        conversation_id,
        reply_to_message_id
      );

    // ----------------------------------------------------------
    // INSERT MESSAGE
    // ----------------------------------------------------------

    const result =
      await pool.query(
        `
        INSERT INTO messages
        (
          conversation_id,
          sender_id,
          message,
          media_type,
          reply_to_message_id
        )
        VALUES (
          $1,
          $2,
          $3,
          'text',
          $4
        )
        RETURNING *
        `,
        [
          conversation_id,
          sender_id,
          String(message).trim(),
          replyToId,
        ]
      );

    const insertedMessage =
      result.rows[0];

    // ----------------------------------------------------------
    // UPDATE CONVERSATION
    // ----------------------------------------------------------

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

    // ----------------------------------------------------------
    // LOAD MESSAGE + REPLY INFORMATION
    // ----------------------------------------------------------

    const newMessage =
      await getMessageWithReply(
        insertedMessage.id
      );

    // ----------------------------------------------------------
    // REAL-TIME MESSAGE DELIVERY
    // ----------------------------------------------------------

    const io = getIO();

    io
      .to(
        `conversation_${conversation_id}`
      )
      .emit(
        "newMessage",
        newMessage
      );

    // ----------------------------------------------------------
    // USER NOTIFICATIONS
    // ----------------------------------------------------------

    await notifyParticipants(
      conversation_id,
      sender_id,
      newMessage
    );

    return res.json(
      newMessage
    );

  } catch (error) {
    console.error(
      "Send message error:",
      error
    );

    return res.status(
      error.status || 500
    ).json({
      error:
        error.message ||
        "Message could not be sent.",
    });
  }
};


// ============================================================
// GET CONVERSATION MESSAGES
// ============================================================

exports.getMessages = async (
  req,
  res
) => {
  try {
    const {
      conversation_id,
    } = req.params;

    const user_id =
      req.user.id;

    const result =
      await pool.query(
        `
        SELECT
          messages.*,

          users.full_name,

          rm.id AS reply_to_id,
          rm.message AS reply_to_message,
          rm.sender_id AS reply_to_sender_id,
          rm.media_type AS reply_to_media_type,
          rm.audio_url AS reply_to_audio_url,
          rm.video_url AS reply_to_video_url,
          rm.created_at AS reply_to_created_at,

          ru.full_name AS reply_to_sender_name

        FROM messages

        JOIN users
          ON users.id =
             messages.sender_id

        JOIN conversations
          ON conversations.id =
             messages.conversation_id

        LEFT JOIN messages rm
          ON rm.id =
             messages.reply_to_message_id

        LEFT JOIN users ru
          ON ru.id =
             rm.sender_id

        WHERE
          messages.conversation_id =
          $1

        AND (
          conversations.buyer_id =
          $2

          OR

          conversations.seller_id =
          $2
        )

        ORDER BY
          messages.created_at ASC
        `,
        [
          conversation_id,
          user_id,
        ]
      );

    const messages =
      result.rows.map(
        (row) => ({
          ...row,

          reply_to:
            row.reply_to_id
              ? {
                  id: Number(
                    row.reply_to_id
                  ),

                  message:
                    row.reply_to_message ||
                    "",

                  sender_id:
                    Number(
                      row.reply_to_sender_id
                    ),

                  sender_name:
                    row.reply_to_sender_name ||
                    "PropertyNestHomes User",

                  media_type:
                    row.reply_to_media_type ||
                    "text",

                  audio_url:
                    row.reply_to_audio_url ||
                    null,

                  video_url:
                    row.reply_to_video_url ||
                    null,

                  created_at:
                    row.reply_to_created_at ||
                    null,
                }
              : null,
        })
      );

    return res.json(
      messages
    );

  } catch (error) {
    console.error(
      "Get messages error:",
      error
    );

    return res.status(500).json({
      error:
        error.message,
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
    const user_id =
      req.user.id;

    const result =
      await pool.query(
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
          messages.media_type AS last_message_type,

          messages.reply_to_message_id AS last_reply_to_message_id

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

    return res.json(
      result.rows
    );

  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    return res.status(500).json({
      error:
        error.message,
    });
  }
};


// ============================================================
// GET CONVERSATION DETAILS
// ============================================================

exports.getConversationDetails =
  async (
    req,
    res
  ) => {
    try {
      const {
        conversation_id,
      } = req.params;

      const userId =
        req.user.id;

      const result =
        await pool.query(
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
            ON buyer.id =
               c.buyer_id

          JOIN users seller
            ON seller.id =
               c.seller_id

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

      if (
        result.rows.length === 0
      ) {
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
    const search =
      String(
        req.query.search || ""
      ).trim();

    const result =
      await pool.query(
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

        ORDER BY
          full_name ASC

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

exports.uploadChatMedia =
  async (
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
        reply_to_message_id,
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

      // --------------------------------------------------------
      // VERIFY CONVERSATION ACCESS
      // --------------------------------------------------------

      const access =
        await pool.query(
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

      if (
        access.rows.length === 0
      ) {
        return res.status(403).json({
          error:
            "Access denied to conversation",
        });
      }

      // --------------------------------------------------------
      // VALIDATE REPLY TARGET
      // --------------------------------------------------------

      const replyToId =
        await validateReplyTarget(
          conversation_id,
          reply_to_message_id
        );

      // --------------------------------------------------------
      // CLOUDINARY UPLOAD
      // --------------------------------------------------------

      const folder =
        media_type === "audio"
          ? "propertynesthomes/chat/audio"
          : "propertynesthomes/chat/video";

      const uploadResult =
        await new Promise(
          (
            resolve,
            reject
          ) => {
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
                    resolve(
                      result
                    );
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

      // --------------------------------------------------------
      // INSERT MEDIA MESSAGE
      // --------------------------------------------------------

      const result =
        await pool.query(
          `
          INSERT INTO messages
          (
            conversation_id,
            sender_id,
            message,
            audio_url,
            video_url,
            media_type,
            reply_to_message_id
          )

          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
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
            replyToId,
          ]
        );

      const insertedMessage =
        result.rows[0];

      // --------------------------------------------------------
      // UPDATE CONVERSATION
      // --------------------------------------------------------

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

      // --------------------------------------------------------
      // LOAD MESSAGE + REPLY
      // --------------------------------------------------------

      const newMessage =
        await getMessageWithReply(
          insertedMessage.id
        );

      // --------------------------------------------------------
      // REAL-TIME MEDIA DELIVERY
      // --------------------------------------------------------

      const io = getIO();

      io
        .to(
          `conversation_${conversation_id}`
        )
        .emit(
          "newMessage",
          newMessage
        );

      // --------------------------------------------------------
      // NOTIFY PARTICIPANTS
      // --------------------------------------------------------

      await notifyParticipants(
        conversation_id,
        req.user.id,
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

      return res.status(
        error.status || 500
      ).json({
        error:
          error.message ||
          "Media upload failed",
      });
    }
  };
