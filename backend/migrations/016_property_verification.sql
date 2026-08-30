-- Property verification fields
-- Keeps fresh installations consistent with the live production schema.

ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending';

ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS verification_notes TEXT;

ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS verified_by INTEGER;

ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS property_registration_id VARCHAR(255);

ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS propertynest_id VARCHAR(255);

-- Existing application logic expects PropertyNest IDs to be unique.
CREATE UNIQUE INDEX IF NOT EXISTS unique_propertynest_id
    ON properties(propertynest_id)
    WHERE propertynest_id IS NOT NULL;

-- Verification documents need to track their review state.
ALTER TABLE property_documents
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending';

-- Keep existing uploaded documents compatible with production.
ALTER TABLE property_documents
    ALTER COLUMN document_name DROP NOT NULL;

-- Useful indexes for the verification workflow.
CREATE INDEX IF NOT EXISTS idx_properties_verification_status
    ON properties(verification_status);

CREATE INDEX IF NOT EXISTS idx_property_documents_verification_status
    ON property_documents(verification_status);
