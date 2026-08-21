BEGIN;

-- ============================================================
-- WhatsApp-style message actions
-- ============================================================

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS forwarded_from_message_id INTEGER;

-- Add forwarding FK only if it does not already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_forwarded_message'
    ) THEN
        ALTER TABLE messages
        ADD CONSTRAINT fk_forwarded_message
        FOREIGN KEY (forwarded_from_message_id)
        REFERENCES messages(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- Message reactions
-- ============================================================

CREATE TABLE IF NOT EXISTS message_reactions (
    id SERIAL PRIMARY KEY,

    message_id INTEGER NOT NULL
        REFERENCES messages(id)
        ON DELETE CASCADE,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    reaction VARCHAR(20) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message
ON message_reactions(message_id);

CREATE INDEX IF NOT EXISTS idx_message_reactions_user
ON message_reactions(user_id);

-- ============================================================
-- Starred messages
-- ============================================================

CREATE TABLE IF NOT EXISTS starred_messages (
    id SERIAL PRIMARY KEY,

    message_id INTEGER NOT NULL
        REFERENCES messages(id)
        ON DELETE CASCADE,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_starred_messages_user
ON starred_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_starred_messages_message
ON starred_messages(message_id);

COMMIT;
