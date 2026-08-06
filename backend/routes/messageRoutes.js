const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createConversation,
  sendMessage,
  getMessages,
  getConversations
} = require("../controllers/messageController");

// Get user conversations
router.get(
  "/conversations",
  authMiddleware,
  getConversations
);

// Create or get conversation
router.post(
  "/conversations",
  authMiddleware,
  createConversation
);


// Send message
router.post(
  "/messages",
  authMiddleware,
  sendMessage
);


// Get conversation messages
router.get(
  "/messages/:conversation_id",
  authMiddleware,
  getMessages
);


module.exports = router;
