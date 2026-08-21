const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const chatMediaUpload = require("../middleware/chatMediaUpload");

const {
  createConversation,
  sendMessage,
  reactToMessage,
  removeMessageReaction,
  getMessages,
  getConversations,
  getConversationDetails,
  uploadChatMedia,
  getPeople,
} = require("../controllers/messageController");

// People / friends-style user list
router.get(
  "/people",
  authMiddleware,
  getPeople
);

// Get user conversations
router.get(
  "/conversations",
  authMiddleware,
  getConversations
);

router.get(
  "/conversations/:conversation_id",
  authMiddleware,
  getConversationDetails
);

// Create or get conversation
router.post(
  "/conversations",
  authMiddleware,
  createConversation
);

// Send text message
router.post(
  "/messages",
  authMiddleware,
  sendMessage
);

// WhatsApp-style message reactions
router.post(
  "/messages/:message_id/reaction",
  authMiddleware,
  reactToMessage
);

router.delete(
  "/messages/:message_id/reaction",
  authMiddleware,
  removeMessageReaction
);

// Upload voice note or video message
router.post(
  "/media",
  authMiddleware,
  chatMediaUpload.single("file"),
  uploadChatMedia
);

// Get conversation messages
router.get(
  "/messages/:conversation_id",
  authMiddleware,
  getMessages
);

module.exports = router;
