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
exports.getConversations = async (req,res)=>{

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

messages.message AS last_message,
messages.created_at AS last_message_time

FROM conversations

JOIN properties
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

WHERE conversations.buyer_id=$1
OR conversations.seller_id=$1

ORDER BY conversations.created_at DESC
`,
[user_id]
);


res.json(result.rows);


  } catch(error){

    console.error(error);

    res.status(500).json({
      error:error.message
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
