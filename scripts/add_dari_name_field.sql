-- Add dariName field to users table
-- This allows storing Dari (Persian) names for students and parents

ALTER TABLE users ADD COLUMN dariName VARCHAR(100) NULL AFTER lastName;

-- Add index for better performance when searching by Dari name
CREATE INDEX idx_users_dari_name ON users(dariName);

-- Note: This field is optional and can be NULL
-- It will be used for card generation and display purposes