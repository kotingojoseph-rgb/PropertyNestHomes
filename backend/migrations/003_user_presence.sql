BEGIN;

CREATE TABLE IF NOT EXISTS user_presence (

    user_id INTEGER PRIMARY KEY
        REFERENCES users(id)
        ON DELETE CASCADE,

    socket_id TEXT,

    is_online BOOLEAN DEFAULT FALSE,

    last_seen TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
