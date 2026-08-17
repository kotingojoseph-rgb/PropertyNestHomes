const pool = require("../config/db");
const { getIO } = require("../socket");

const cloudinary = require("../config/cloudinary");

// Create or get conversation
exports.createConversation = async (req, res) => {
  try {
    const { property_id = null, seller_id } = req.body;
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

    // Direct user-to-user chat
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

    // Existing property conversation behavior
    const result = await pool.query(
      `
      INSERT INTO conversations
      (
        property_id,
        buyer_id,
        seller_id
      )
      VALUES ($1,$2,$3)

      ON CONFLICT(property_id,buyer_id,seller_id)
      DO UPDATE SET property_id = EXCLUDED.property_id

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
    console.error("Create conversation error:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};


// Send message
exports.sendMessage = async (req, res) => {

  try {

    const {
      conversation_id,
      message
    } = req.body;


    const sender_id = req.user.id;


    const result = await pool.query(
      `
      INSERT INTO messages
      (
        conversation_id,
        sender_id,
        message
      )

      VALUES ($1,$2,$3)

      RETURNING *
      `,
      [
        conversation_id,
        sender_id,
        message
      ]
    );


    const newMessage = result.rows[0];


    // Real-time message delivery
    getIO()
      .to(`conversation_${conversation_id}`)
      .emit(
        "newMessage",
        newMessage
      );


    res.json(newMessage);


  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }

};



// Get messages
exports.getMessages = async (req, res) => {

  try {

    const { conversation_id } = req.params;


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
ON conversations.id = messages.conversation_id

      WHERE messages.conversation_id=$1

AND (
  conversations.buyer_id=$2
  OR conversations.seller_id=$2
)

ORDER BY created_at ASC
      `,
     [
  conversation_id,
  user_id
]
    );


    res.json(result.rows);


  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }

};

// Get user conversations
exports.getConversations = async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(
      `
      SELECT
        conversations.id,
        conversations.property_id,
        properties.title,
        properties.image,

        buyer.full_name AS buyer_name,
        seller.full_name AS seller_name,

        CASE
          WHEN conversations.buyer_id = $1
          THEN seller.full_name
          ELSE buyer.full_name
        END AS other_user_name,

        messages.message AS last_message,
        messages.created_at AS last_message_time

      FROM conversations

      LEFT JOIN properties
        ON properties.id = conversations.property_id

      JOIN users buyer
        ON buyer.id = conversations.buyer_id

      JOIN users seller
        ON seller.id = conversations.seller_id

      LEFT JOIN messages
        ON messages.id =
        (
          SELECT id
          FROM messages
          WHERE conversation_id = conversations.id
          ORDER BY created_at DESC
          LIMIT 1
        )

      WHERE conversations.buyer_id = $1
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
    console.error("Get conversations error:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};


// Get conversation participants
exports.getConversationDetails = async (req,res)=>{

  try {

    const { conversation_id } = req.params;

    const result = await pool.query(
      `
      SELECT
        buyer_id,
        seller_id
      FROM conversations
      WHERE id = $1
      `,
      [
        conversation_id
      ]
    );


    if(result.rows.length === 0){
      return res.status(404).json({
        error:"Conversation not found"
      });
    }


    res.json(result.rows[0]);


  } catch(error){

    console.error(error);

    res.status(500).json({
      error:error.message
    });

  }

};

exports.uploadChatMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No media file uploaded",
      });
    }

    const { conversation_id, media_type } = req.body;

    if (!conversation_id) {
      return res.status(400).json({
        error: "conversation_id is required",
      });
    }

    if (!["audio", "video"].includes(media_type)) {
      return res.status(400).json({
        error: "media_type must be audio or video",
      });
    }

    const access = await pool.query(
      `
      SELECT id
      FROM conversations
      WHERE id = $1
      AND (
        buyer_id = $2
        OR seller_id = $2
      )
      `,
      [conversation_id, req.user.id]
    );

    if (access.rows.length === 0) {
      return res.status(403).json({
        error: "Access denied to conversation",
      });
    }

    const resourceType = "video";

    const folder =
      media_type === "audio"
        ? "propertynesthomes/chat/audio"
        : "propertynesthomes/chat/video";

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      stream.end(req.file.buffer);
    });

    const audioUrl =
      media_type === "audio"
        ? uploadResult.secure_url
        : null;

    const videoUrl =
      media_type === "video"
        ? uploadResult.secure_url
        : null;

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
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        conversation_id,
        req.user.id,
        media_type === "audio"
          ? "🎤 Voice message"
          : "🎥 Video message",
        audioUrl,
        videoUrl,
        media_type,
      ]
    );

    const newMessage = result.rows[0];

    getIO()
      .to(`conversation_${conversation_id}`)
      .emit("newMessage", newMessage);

    return res.json(newMessage);

  } catch (error) {
    console.error("Chat media upload error:", error);

    return res.status(500).json({
      error: "Media upload failed",
    });
  }
};

exports.getPeople = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();

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
        OR full_name ILIKE '%' || $2 || '%'
        OR email ILIKE '%' || $2 || '%'
      )
      ORDER BY full_name ASC
      LIMIT 50
      `,
      [req.user.id, search]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Get people error:", error);

    return res.status(500).json({
      error: "Unable to load people",
    });
  }
};
