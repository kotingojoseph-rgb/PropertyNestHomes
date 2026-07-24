const pool = require("../config/db");
const { getIO } = require("../socket");


// Create or get conversation
exports.createConversation = async (req, res) => {
  try {

    const { property_id, seller_id } = req.body;

    const buyer_id = req.user.id;


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
        seller_id
      ]
    );


    res.json(result.rows[0]);


  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
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


    const result = await pool.query(
      `
      SELECT
        messages.*,
        users.full_name

      FROM messages

      JOIN users
      ON users.id = messages.sender_id

      WHERE conversation_id=$1

      ORDER BY created_at ASC
      `,
      [
        conversation_id
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
