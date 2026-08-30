-- Property verification documents
-- Used for seller/landlord/agent property registration verification.

CREATE TABLE IF NOT EXISTS property_documents (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL,
    document_type VARCHAR(100) NOT NULL DEFAULT 'registration_certificate',
    document_name VARCHAR(255) NOT NULL,
    document_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT property_documents_property_id_fkey
        FOREIGN KEY (property_id)
        REFERENCES properties(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_property_documents_property_id
    ON property_documents(property_id);
