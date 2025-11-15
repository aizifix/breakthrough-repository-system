-- Table for Departments
CREATE TABLE IF NOT EXISTS tbl_department (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for Research Types
CREATE TABLE IF NOT EXISTS tbl_research_type (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for Categories
CREATE TABLE IF NOT EXISTS tbl_category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default departments
INSERT INTO tbl_department (name, description) VALUES
('College of Management and Accountancy', 'College of Management and Accountancy'),
('College of Engineering and Architecture', 'College of Engineering and Architecture'),
('College of Education', 'College of Education'),
('School of Criminology and Criminal Justice', 'School of Criminology and Criminal Justice'),
('College of Information Technology', 'College of Information Technology'),
('College of Allied Health and Sciences', 'College of Allied Health and Sciences')
ON DUPLICATE KEY UPDATE name=name;

-- Insert default research types
INSERT INTO tbl_research_type (name, description) VALUES
('Peer-Reviewed', 'Peer-reviewed research papers'),
('White Paper', 'White papers and technical documents'),
('Case Study', 'Case studies and analysis'),
('Technical Report', 'Technical reports and documentation'),
('Survey', 'Survey and research studies')
ON DUPLICATE KEY UPDATE name=name;

-- Insert default categories
INSERT INTO tbl_category (name, description) VALUES
('Artificial Intelligence', 'AI and machine learning research'),
('Machine Learning', 'Machine learning algorithms and applications'),
('Biotechnology', 'Biotechnology and life sciences'),
('Nanotechnology', 'Nanotechnology and materials science'),
('Quantum Computing', 'Quantum computing and quantum physics'),
('Climate Science', 'Climate and environmental science')
ON DUPLICATE KEY UPDATE name=name;
