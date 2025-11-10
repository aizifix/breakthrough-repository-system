-- ============================================
-- MySQL Version
-- ============================================
CREATE TABLE tbl_repository (
    id INT PRIMARY KEY AUTO_INCREMENT,           -- Primary key with auto increment
    title VARCHAR(500) NOT NULL,                 -- Research title
    abstract TEXT NOT NULL,                      -- Research abstract
    publisher INT NOT NULL,                      -- Publisher user_id (foreign key to tbl_users)
    category VARCHAR(255),                       -- Research category
    tags VARCHAR(500),                          -- Research tags (comma-separated or JSON)
    publishedDate DATE,                          -- Date when research was published
    publishedStatus ENUM('pending', 'published', 'rejected', 'unpublished') DEFAULT 'pending' NOT NULL, -- Publication status
    pdfUrl VARCHAR(500),                        -- URL or path to PDF file
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Record update timestamp
);

-- Add foreign key constraint
ALTER TABLE tbl_repository
ADD CONSTRAINT fk_repository_publisher
FOREIGN KEY (publisher) REFERENCES tbl_users(user_id)
ON DELETE CASCADE;

-- Add indexes
CREATE INDEX idx_repository_publisher ON tbl_repository(publisher);
CREATE INDEX idx_repository_status ON tbl_repository(publishedStatus);
CREATE INDEX idx_repository_category ON tbl_repository(category);
CREATE INDEX idx_repository_published_date ON tbl_repository(publishedDate);

-- ============================================
-- SQL QUERIES FOR ADDING/PUBLISHING RESEARCH
-- ============================================

-- INSERT: Add new research (status will be 'pending' by default)
INSERT INTO tbl_repository (
    title,
    abstract,
    publisher,
    category,
    tags,
    pdfUrl,
    publishedStatus
) VALUES (
    :title,
    :abstract,
    :publisher,
    :category,
    :tags,
    :pdfUrl,
    'pending'
);

-- UPDATE: Approve and publish research (Admin operation)
UPDATE tbl_repository
SET
    publishedStatus = 'published',
    publishedDate = CURDATE(),
    updated_at = CURRENT_TIMESTAMP
WHERE id = :repository_id
AND publishedStatus = 'pending';

-- UPDATE: Reject research (Admin operation)
UPDATE tbl_repository
SET
    publishedStatus = 'rejected',
    updated_at = CURRENT_TIMESTAMP
WHERE id = :repository_id
AND publishedStatus = 'pending';

-- UPDATE: Unpublish research
UPDATE tbl_repository
SET
    publishedStatus = 'unpublished',
    updated_at = CURRENT_TIMESTAMP
WHERE id = :repository_id
AND publishedStatus = 'published';

-- SELECT: Get all pending research for admin moderation
SELECT
    r.id,
    r.title,
    r.abstract,
    r.publisher,
    u.user_name AS publisher_name,
    u.user_email AS publisher_email,
    r.category,
    r.tags,
    r.publishedDate,
    r.publishedStatus,
    r.pdfUrl,
    r.created_at,
    r.updated_at
FROM tbl_repository r
INNER JOIN tbl_users u ON r.publisher = u.user_id
WHERE r.publishedStatus = 'pending'
ORDER BY r.created_at DESC;

-- SELECT: Get all published research (public view)
SELECT
    r.id,
    r.title,
    r.abstract,
    r.publisher,
    u.user_name AS publisher_name,
    u.user_email AS publisher_email,
    u.user_school AS publisher_school,
    u.user_department AS publisher_department,
    r.category,
    r.tags,
    r.publishedDate,
    r.pdfUrl,
    r.created_at
FROM tbl_repository r
INNER JOIN tbl_users u ON r.publisher = u.user_id
WHERE r.publishedStatus = 'published'
ORDER BY r.publishedDate DESC;

-- SELECT: Get research by publisher
SELECT
    r.id,
    r.title,
    r.abstract,
    r.category,
    r.tags,
    r.publishedDate,
    r.publishedStatus,
    r.pdfUrl,
    r.created_at,
    r.updated_at
FROM tbl_repository r
WHERE r.publisher = :user_id
ORDER BY r.created_at DESC;

-- SELECT: Get single research by ID
SELECT
    r.id,
    r.title,
    r.abstract,
    r.publisher,
    u.user_name AS publisher_name,
    u.user_email AS publisher_email,
    u.user_school AS publisher_school,
    u.user_department AS publisher_department,
    r.category,
    r.tags,
    r.publishedDate,
    r.publishedStatus,
    r.pdfUrl,
    r.created_at,
    r.updated_at
FROM tbl_repository r
INNER JOIN tbl_users u ON r.publisher = u.user_id
WHERE r.id = :repository_id;

-- UPDATE: Update research details (Publisher operation)
UPDATE tbl_repository
SET
    title = :title,
    abstract = :abstract,
    category = :category,
    tags = :tags,
    pdfUrl = :pdfUrl,
    updated_at = CURRENT_TIMESTAMP
WHERE id = :repository_id
AND publisher = :user_id
AND publishedStatus IN ('pending', 'unpublished');

-- DELETE: Delete research (Publisher operation)
DELETE FROM tbl_repository
WHERE id = :repository_id
AND publisher = :user_id
AND publishedStatus IN ('pending', 'unpublished');


-- ============================================
-- PostgreSQL Version (Alternative)
-- ============================================
/*
CREATE TABLE tbl_repository (
    id SERIAL PRIMARY KEY,                      -- Primary key with auto increment
    title VARCHAR(500) NOT NULL,                 -- Research title
    abstract TEXT NOT NULL,                      -- Research abstract
    publisher INT NOT NULL,                      -- Publisher user_id (foreign key to tbl_users)
    category VARCHAR(255),                       -- Research category
    tags VARCHAR(500),                          -- Research tags (comma-separated or JSON)
    publishedDate DATE,                          -- Date when research was published
    publishedStatus VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (publishedStatus IN ('pending', 'published', 'rejected', 'unpublished')), -- Publication status
    pdfUrl VARCHAR(500),                        -- URL or path to PDF file
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Record update timestamp
);

-- Add foreign key constraint
ALTER TABLE tbl_repository
ADD CONSTRAINT fk_repository_publisher
FOREIGN KEY (publisher) REFERENCES tbl_users(user_id)
ON DELETE CASCADE;

-- Add indexes
CREATE INDEX idx_repository_publisher ON tbl_repository(publisher);
CREATE INDEX idx_repository_status ON tbl_repository(publishedStatus);
CREATE INDEX idx_repository_category ON tbl_repository(category);
CREATE INDEX idx_repository_published_date ON tbl_repository(publishedDate);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_repository_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_tbl_repository_updated_at
    BEFORE UPDATE ON tbl_repository
    FOR EACH ROW
    EXECUTE FUNCTION update_repository_updated_at_column();

-- INSERT: Add new research (status will be 'pending' by default)
INSERT INTO tbl_repository (
    title,
    abstract,
    publisher,
    category,
    tags,
    pdfUrl,
    publishedStatus
) VALUES (
    :title,
    :abstract,
    :publisher,
    :category,
    :tags,
    :pdfUrl,
    'pending'
);

-- UPDATE: Approve and publish research (Admin operation)
UPDATE tbl_repository
SET
    publishedStatus = 'published',
    publishedDate = CURRENT_DATE,
    updated_at = CURRENT_TIMESTAMP
WHERE id = :repository_id
AND publishedStatus = 'pending';
*/
