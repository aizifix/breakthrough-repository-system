-- Migration: Add plagiarism check results column to tbl_repository
-- Run this SQL to add the plagiarism_results column

ALTER TABLE `tbl_repository`
ADD COLUMN `plagiarism_results` TEXT NULL DEFAULT NULL COMMENT 'JSON stored plagiarism check results' AFTER `pdfUrl`;
