-- Add missing research types to tbl_research_type table
-- This script adds: Whitepaper, Capstone, Thesis, Custom

INSERT INTO tbl_research_type (name, description, created_at, updated_at, is_active) VALUES
('Whitepaper', 'Whitepapers and technical documents', NOW(), NOW(), 1),
('Capstone', 'Capstone projects and final year projects', NOW(), NOW(), 1),
('Thesis', 'Thesis and dissertation papers', NOW(), NOW(), 1),
('Custom', 'Custom research type', NOW(), NOW(), 1)
ON DUPLICATE KEY UPDATE
    description = VALUES(description),
    updated_at = NOW(),
    is_active = 1;
