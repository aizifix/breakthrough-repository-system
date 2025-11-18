ALTER TABLE tbl_users
ADD COLUMN IF NOT EXISTS student_id_number VARCHAR(100) AFTER user_unique_id,
ADD COLUMN IF NOT EXISTS student_id_image VARCHAR(255) AFTER student_id_number;
