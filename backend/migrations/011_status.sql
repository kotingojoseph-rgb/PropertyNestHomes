BEGIN;

CREATE TABLE IF NOT EXISTS statuses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT,
    media_type VARCHAR(20) DEFAULT 'text',
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE TABLE IF NOT EXISTS status_views (
    id SERIAL PRIMARY KEY,
    status_id INTEGER NOT NULL REFERENCES statuses(id) ON DELETE CASCADE,
    viewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(status_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_statuses_user_id
ON statuses(user_id);

CREATE INDEX IF NOT EXISTS idx_statuses_expires_at
ON statuses(expires_at);

CREATE INDEX IF NOT EXISTS idx_status_views_status_id
ON status_views(status_id);

COMMIT;
