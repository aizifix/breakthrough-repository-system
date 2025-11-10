-- Migration: Add research_type column to tbl_repository
-- This migration adds the research_type field to support different types of research papers

-- Check if column exists before adding (safe migration)
SET @col_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tbl_repository'
    AND COLUMN_NAME = 'research_type'
);

-- Add research_type column if it doesn't exist
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE tbl_repository ADD COLUMN research_type VARCHAR(100) DEFAULT NULL AFTER category',
    'SELECT "Column research_type already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_repository_research_type ON tbl_repository(research_type);
