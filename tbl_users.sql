-- ============================================
-- MySQL Version
-- ============================================
CREATE TABLE tbl_users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,  -- Primary key with auto increment
    user_name VARCHAR(255) NOT NULL,         -- User's full name
    user_email VARCHAR(255) NOT NULL UNIQUE, -- User's email (unique)
    user_pwd VARCHAR(255) NOT NULL,          -- User's password (hashed)
    user_school VARCHAR(255),                -- User's school/institution
    user_department VARCHAR(255),            -- User's department
    user_role VARCHAR(50) DEFAULT 'publisher' NOT NULL, -- User role (default: publisher)
    user_type VARCHAR(100),                  -- User type
    user_contact VARCHAR(50),                -- User's contact number
    user_address TEXT,                       -- User's address
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Record update timestamp
);

-- Add indexes
CREATE INDEX idx_user_email ON tbl_users(user_email);
CREATE INDEX idx_user_role ON tbl_users(user_role);


-- ============================================
-- PostgreSQL Version (Alternative)
-- ============================================
/*
CREATE TABLE tbl_users (
    user_id SERIAL PRIMARY KEY,              -- Primary key with auto increment
    user_name VARCHAR(255) NOT NULL,         -- User's full name
    user_email VARCHAR(255) NOT NULL UNIQUE, -- User's email (unique)
    user_pwd VARCHAR(255) NOT NULL,          -- User's password (hashed)
    user_school VARCHAR(255),                -- User's school/institution
    user_department VARCHAR(255),            -- User's department
    user_role VARCHAR(50) DEFAULT 'publisher' NOT NULL, -- User role (default: publisher)
    user_type VARCHAR(100),                  -- User type
    user_contact VARCHAR(50),                -- User's contact number
    user_address TEXT,                       -- User's address
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Record update timestamp
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_tbl_users_updated_at
    BEFORE UPDATE ON tbl_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes
CREATE INDEX idx_user_email ON tbl_users(user_email);
CREATE INDEX idx_user_role ON tbl_users(user_role);
*/
