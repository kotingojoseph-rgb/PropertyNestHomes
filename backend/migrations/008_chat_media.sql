BEGIN;

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS video_url TEXT;

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS media_type VARCHAR(20) DEFAULT 'text';

CREATE INDEX IF NOT EXISTS idx_messages_media_type
ON messages(media_type);

COMMIT;
