-- Add view_count column to tbl_repository table if it doesn't exist
-- This script adds a view_count column to track the number of times a repository has been viewed

ALTER TABLE tbl_repository
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- Update existing repositories to have 0 views if they are NULL
UPDATE tbl_repository
SET view_count = 0
WHERE view_count IS NULL;
