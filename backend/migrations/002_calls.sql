BEGIN;

CREATE TABLE IF NOT EXISTS calls (

    id SERIAL PRIMARY KEY,

    conversation_id INTEGER NOT NULL
        REFERENCES conversations(id)
        ON DELETE CASCADE,

    caller_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    receiver_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    call_type VARCHAR(20) NOT NULL,

    status VARCHAR(20) DEFAULT 'ringing',

    started_at TIMESTAMP,

    answered_at TIMESTAMP,

    ended_at TIMESTAMP,

    duration INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calls_conversation
ON calls(conversation_id);

COMMIT;
