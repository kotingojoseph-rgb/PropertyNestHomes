BEGIN;

-- Conversation timestamps used by the chat controller
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP;

-- Message delivery/read timestamps
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Keep existing is_read compatible with the newer read_at system
UPDATE messages
SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
WHERE is_read = TRUE
  AND read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id
  ON conversations(buyer_id);

CREATE INDEX IF NOT EXISTS idx_conversations_seller_id
  ON conversations(seller_id);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
  ON conversations(last_message_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages(conversation_id, created_at);

COMMIT;
