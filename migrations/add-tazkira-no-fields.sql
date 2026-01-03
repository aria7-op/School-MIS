-- Add tazkiraNo field to students table
ALTER TABLE students ADD COLUMN tazkiraNo VARCHAR(50) NULL AFTER religion;

-- Add tazkiraNo field to users table
ALTER TABLE users ADD COLUMN tazkiraNo VARCHAR(50) NULL AFTER emailVerified;

-- Remove unwanted fields from students table
ALTER TABLE students DROP COLUMN IF EXISTS aadharNo;
ALTER TABLE students DROP COLUMN IF EXISTS caste;
ALTER TABLE students DROP COLUMN IF EXISTS ifscCode;

-- Remove unwanted fields from users table (email and password will be handled by application logic)
-- Note: email and password columns are kept for existing data compatibility
-- but the application will no longer require them for new students/parents 