-- Update departments in tbl_department table
-- This script replaces existing departments with the new college/school names

-- First, deactivate all existing departments
UPDATE tbl_department SET is_active = 0, updated_at = NOW();

-- Insert new departments
INSERT INTO tbl_department (name, description, created_at, updated_at, is_active) VALUES
('College of Management and Accountancy', 'College of Management and Accountancy', NOW(), NOW(), 1),
('College of Engineering and Architecture', 'College of Engineering and Architecture', NOW(), NOW(), 1),
('College of Education', 'College of Education', NOW(), NOW(), 1),
('School of Criminology and Criminal Justice', 'School of Criminology and Criminal Justice', NOW(), NOW(), 1),
('College of Information Technology', 'College of Information Technology', NOW(), NOW(), 1),
('College of Allied Health and Sciences', 'College of Allied Health and Sciences', NOW(), NOW(), 1)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    updated_at = NOW(),
    is_active = 1;
