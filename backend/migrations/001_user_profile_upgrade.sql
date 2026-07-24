BEGIN;

-- International location support
ALTER TABLE users
ADD COLUMN IF NOT EXISTS country VARCHAR(100);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS state VARCHAR(100);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS city VARCHAR(100);


-- User timezone for global communication
ALTER TABLE users
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100)
DEFAULT 'UTC';


-- Profile information
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;


ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio TEXT;


-- Agent/company information
ALTER TABLE users
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);


-- Account status
ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_status VARCHAR(30)
DEFAULT 'active';


COMMIT;
