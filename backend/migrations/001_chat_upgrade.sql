-- ==========================================
-- PropertyNestHomes Chat Upgrade v1
-- Safe migration (does not delete data)
-- ==========================================

BEGIN;

-- =========================
-- Conversations
-- =========================

ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP;

-- =========================
-- Messages
-- =========================

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS document_url TEXT;

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS audio_url TEXT;

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS reply_to_message_id INTEGER;

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

ALTER TABLE messages
ADD CONSTRAINT fk_reply_message
FOREIGN KEY (reply_to_message_id)
REFERENCES messages(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_conversation
ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender
ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_created
ON messages(created_at);

COMMIT;
