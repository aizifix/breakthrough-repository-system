-- Add is_verified column to tbl_users table if it doesn't exist
-- This script adds an is_verified column to track user verification status

ALTER TABLE tbl_users
ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) DEFAULT 0;

-- Update existing users to have 0 (unverified) if they are NULL
UPDATE tbl_users
SET is_verified = 0
WHERE is_verified IS NULL;
