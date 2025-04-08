-- Add email column to the builds table
ALTER TABLE builds 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create an index on the email column for faster lookups
CREATE INDEX IF NOT EXISTS idx_builds_email ON builds (email);

-- Add comment to describe the purpose of the email field
COMMENT ON COLUMN builds.email IS 'Email of the user who created the build, captured during save';

-- Update any existing records without an email to have an empty string
UPDATE builds 
SET email = '' 
WHERE email IS NULL; 