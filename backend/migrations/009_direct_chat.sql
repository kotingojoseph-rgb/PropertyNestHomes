BEGIN;

ALTER TABLE conversations
ALTER COLUMN property_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_direct_chat
ON conversations(buyer_id, seller_id)
WHERE property_id IS NULL;

COMMIT;
