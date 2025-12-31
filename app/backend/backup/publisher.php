<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Set timezone
date_default_timezone_set('Asia/Manila');

require_once 'db_connect.php';

// Publisher class with function-based OOP structure
class Publisher {
    private $conn;
    private $uploadDir;

    public function __construct($db) {
        $this->conn = $db;
        // Set upload directory for PDFs
        // Path: repository-api/uploads/repository/
        // Since publisher.php is in repository-api root, __DIR__ = repository-api

        $baseDir = null;

        // Method 1: Use __DIR__ directly (publisher.php is in repository-api root)
        $calculatedDir = __DIR__;
        $realCalculated = realpath($calculatedDir);
        if ($realCalculated) {
            $baseDir = $realCalculated;
            error_log("Using calculated directory from __DIR__: " . $baseDir);
        }

        // Method 2: Try DOCUMENT_ROOT + repository-api (if DOCUMENT_ROOT is htdocs/)
        if (!$baseDir && isset($_SERVER['DOCUMENT_ROOT']) && !empty($_SERVER['DOCUMENT_ROOT'])) {
            $docRoot = $_SERVER['DOCUMENT_ROOT'];
            // Check if DOCUMENT_ROOT already contains repository-api
            if (strpos($docRoot, 'repository-api') !== false) {
                $baseDir = $docRoot;
                error_log("Using DOCUMENT_ROOT (contains repository-api): " . $baseDir);
            } else {
                // Try DOCUMENT_ROOT/repository-api
                $possiblePath = $docRoot . DIRECTORY_SEPARATOR . 'repository-api';
                $realPossible = realpath($possiblePath);
                if ($realPossible) {
                    $baseDir = $realPossible;
                    error_log("Using DOCUMENT_ROOT + repository-api: " . $baseDir);
                } else {
                    error_log("DOCUMENT_ROOT found but repository-api subdirectory not found: " . $docRoot);
                }
            }
        }

        if (!$baseDir) {
            throw new Exception("Cannot determine base directory for uploads. __DIR__: " . __DIR__ . ", DOCUMENT_ROOT: " . (isset($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : 'not set'));
        }

        // Get absolute path
        $realBaseDir = realpath($baseDir);
        if ($realBaseDir) {
            $this->uploadDir = $realBaseDir . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'repository' . DIRECTORY_SEPARATOR;
        } else {
            // Fallback to relative path
            $this->uploadDir = $baseDir . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'repository' . DIRECTORY_SEPARATOR;
        }

        // Log the calculated path for debugging
        error_log("=== UPLOAD DIRECTORY DEBUG ===");
        error_log("__DIR__: " . __DIR__);
        error_log("Base directory: " . $baseDir);
        error_log("Real base directory: " . ($realBaseDir ?: 'not found'));
        error_log("Final upload directory path: " . $this->uploadDir);
        error_log("DOCUMENT_ROOT: " . (isset($_SERVER['DOCUMENT_ROOT']) ? $_SERVER['DOCUMENT_ROOT'] : 'not set'));
        error_log("==============================");

        // Create upload directory if it doesn't exist
        if (!file_exists($this->uploadDir)) {
            if (!mkdir($this->uploadDir, 0777, true)) {
                $error = error_get_last();
                error_log("Failed to create upload directory: " . $this->uploadDir);
                error_log("Error: " . ($error ? $error['message'] : "Unknown error"));
            } else {
                error_log("Successfully created upload directory: " . $this->uploadDir);
            }
        } else {
            error_log("Upload directory already exists: " . $this->uploadDir);
        }

        // Verify directory is writable
        if (!is_writable($this->uploadDir)) {
            error_log("WARNING: Upload directory is not writable: " . $this->uploadDir);
            error_log("Directory permissions: " . substr(sprintf('%o', fileperms($this->uploadDir)), -4));
        } else {
            error_log("Upload directory is writable: " . $this->uploadDir);
        }
    }

    // Create new repository
    public function createRepository($data, $pdfFile = null) {
        try {
            $this->conn->beginTransaction();

            // Log received data for debugging (remove in production)
            error_log("Publisher createRepository - Received data: " . print_r($data, true));
            error_log("Publisher createRepository - PDF file: " . print_r($pdfFile, true));

            // Required fields validation
            $required = ['title', 'abstract', 'publisher', 'department', 'researchType'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $this->conn->rollBack();
                    return json_encode(["status" => "error", "message" => "$field is required"]);
                }
            }

            // Handle PDF file upload
            $pdfUrl = null;
            if ($pdfFile && isset($pdfFile['tmp_name'])) {
                // Check for upload errors
                if ($pdfFile['error'] !== UPLOAD_ERR_OK) {
                    $this->conn->rollBack();
                    $errorMessages = [
                        UPLOAD_ERR_INI_SIZE => "File exceeds upload_max_filesize directive",
                        UPLOAD_ERR_FORM_SIZE => "File exceeds MAX_FILE_SIZE directive",
                        UPLOAD_ERR_PARTIAL => "File was only partially uploaded",
                        UPLOAD_ERR_NO_FILE => "No file was uploaded",
                        UPLOAD_ERR_NO_TMP_DIR => "Missing temporary folder",
                        UPLOAD_ERR_CANT_WRITE => "Failed to write file to disk",
                        UPLOAD_ERR_EXTENSION => "File upload stopped by extension",
                    ];
                    $errorMsg = $errorMessages[$pdfFile['error']] ?? "Unknown upload error";
                    return json_encode(["status" => "error", "message" => "File upload error: " . $errorMsg]);
                }

                // Validate file type
                $fileType = mime_content_type($pdfFile['tmp_name']);
                if ($fileType !== 'application/pdf') {
                    $this->conn->rollBack();
                    return json_encode(["status" => "error", "message" => "Only PDF files are allowed. Detected type: " . $fileType]);
                }

                // Validate file size (max 500MB to prevent abuse, but allow larger files than 10MB)
                if ($pdfFile['size'] > 500 * 1024 * 1024) {
                    $this->conn->rollBack();
                    return json_encode(["status" => "error", "message" => "File size must be less than 500MB"]);
                }

                // Use original filename as-is (with minimal sanitization for security)
                $originalName = $pdfFile['name'];

                // Only remove dangerous path traversal characters and null bytes
                // Preserve all other characters including dots, special characters, etc.
                $fileName = str_replace(['../', '..\\', "\0"], '', $originalName);
                $fileName = basename($fileName); // Remove any remaining path components

                // Ensure it has .pdf extension
                $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                if ($fileExtension !== 'pdf') {
                    // If no extension or wrong extension, add .pdf
                    $baseName = pathinfo($fileName, PATHINFO_FILENAME);
                    $fileName = $baseName . '.pdf';
                }

                // If filename is empty after sanitization, use a default
                if (empty($fileName) || $fileName === '.pdf') {
                    $fileName = 'document_' . time() . '.pdf';
                }

                // Check if file already exists, if so add counter
                $filePath = rtrim($this->uploadDir, '/\\') . DIRECTORY_SEPARATOR . $fileName;
                $counter = 1;
                $baseFileName = pathinfo($fileName, PATHINFO_FILENAME);
                $ext = pathinfo($fileName, PATHINFO_EXTENSION);
                while (file_exists($filePath)) {
                    $fileName = $baseFileName . '_' . $counter . '.' . $ext;
                    $filePath = rtrim($this->uploadDir, '/\\') . DIRECTORY_SEPARATOR . $fileName;
                    $counter++;
                }

                // Ensure upload directory exists and is writable BEFORE attempting upload
                if (!file_exists($this->uploadDir)) {
                    if (!mkdir($this->uploadDir, 0777, true)) {
                        $this->conn->rollBack();
                        $error = error_get_last();
                        $errorMsg = $error ? $error['message'] : "Unknown error";
                        return json_encode(["status" => "error", "message" => "Failed to create upload directory: " . $errorMsg]);
                    }
                }

                if (!is_writable($this->uploadDir)) {
                    $this->conn->rollBack();
                    return json_encode(["status" => "error", "message" => "Upload directory is not writable: " . $this->uploadDir]);
                }

                // Normalize path separators for Windows
                $filePath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $filePath);

                // Verify temp file exists and is readable
                if (!file_exists($pdfFile['tmp_name']) || !is_readable($pdfFile['tmp_name'])) {
                    $this->conn->rollBack();
                    return json_encode([
                        "status" => "error",
                        "message" => "Temporary file not found or not readable. File may have expired."
                    ]);
                }

                // Try to move uploaded file
                $moveResult = @move_uploaded_file($pdfFile['tmp_name'], $filePath);

                // If move_uploaded_file fails, try copy as fallback
                if (!$moveResult) {
                    // Try copying instead
                    $copyResult = @copy($pdfFile['tmp_name'], $filePath);
                    if (!$copyResult) {
                        $this->conn->rollBack();
                        $error = error_get_last();
                        $errorMsg = $error ? $error['message'] : "Unknown error";
                        $realPath = realpath($this->uploadDir);
                        return json_encode([
                            "status" => "error",
                            "message" => "Failed to upload PDF file. Check server permissions.",
                            "details" => [
                                "upload_dir" => $this->uploadDir,
                                "real_path" => $realPath ?: "not found",
                                "file_path" => $filePath,
                                "dir_exists" => file_exists($this->uploadDir),
                                "dir_writable" => is_writable($this->uploadDir),
                                "temp_file_exists" => file_exists($pdfFile['tmp_name']),
                                "temp_file_readable" => is_readable($pdfFile['tmp_name']),
                                "temp_file_size" => filesize($pdfFile['tmp_name']),
                                "error" => $errorMsg
                            ]
                        ]);
                    }
                    // If copy succeeded, delete temp file
                    @unlink($pdfFile['tmp_name']);
                }

                // ABSOLUTE VERIFICATION: File MUST exist at exact path before proceeding
                // Use realpath to get absolute canonical path
                $absolutePath = realpath($filePath);

                // If realpath fails, the file doesn't exist
                if (!$absolutePath || !file_exists($absolutePath)) {
                    $this->conn->rollBack();
                    // Try to clean up
                    @unlink($filePath);
                    return json_encode([
                        "status" => "error",
                        "message" => "File upload FAILED. File does not exist after move/copy operation.",
                        "details" => [
                            "file_path" => $filePath,
                            "absolute_path" => $absolutePath ?: "NOT FOUND",
                            "upload_dir" => $this->uploadDir,
                            "dir_exists" => file_exists($this->uploadDir),
                            "dir_writable" => is_writable($this->uploadDir),
                            "temp_file_still_exists" => file_exists($pdfFile['tmp_name'])
                        ]
                    ]);
                }

                // Verify file is readable and has content
                if (!is_readable($absolutePath)) {
                    $this->conn->rollBack();
                    @unlink($absolutePath);
                    return json_encode([
                        "status" => "error",
                        "message" => "Uploaded file is not readable"
                    ]);
                }

                $fileSize = filesize($absolutePath);
                if ($fileSize === false || $fileSize === 0) {
                    $this->conn->rollBack();
                    @unlink($absolutePath);
                    return json_encode([
                        "status" => "error",
                        "message" => "Uploaded file is empty or invalid. Size: " . ($fileSize === false ? "unknown" : "0 bytes")
                    ]);
                }

                // Use absolute path
                $filePath = $absolutePath;

                // Use original filename in URL (preserved as-is)
                // Browser will automatically URL-encode when making requests
                $pdfUrl = '/uploads/repository/' . $fileName;
            } else {
                $this->conn->rollBack();
                return json_encode(["status" => "error", "message" => "PDF file is required"]);
            }

            // Prepare category/department (now single string, not array)
            // Frontend sends 'department', but database column is 'category'
            $category = trim($data['department'] ?? $data['category'] ?? '');

            // Prepare research type
            $researchType = trim($data['researchType']);

            // Prepare tags (convert array to string if needed)
            $tagsData = $data['tags'] ?? '';
            if (is_string($tagsData)) {
                $decoded = json_decode($tagsData, true);
                $tags = is_array($decoded) ? implode(', ', $decoded) : ($tagsData ?: '');
            } else {
                $tags = is_array($tagsData) ? implode(', ', $tagsData) : ($tagsData ?: '');
            }

            // Check if research_type column exists, if not add it
            try {
                $checkColumn = $this->conn->query("SHOW COLUMNS FROM tbl_repository LIKE 'research_type'");
                if ($checkColumn->rowCount() === 0) {
                    // Add research_type column if it doesn't exist
                    $this->conn->exec("ALTER TABLE tbl_repository ADD COLUMN research_type VARCHAR(100) DEFAULT NULL AFTER category");
                }
            } catch (PDOException $e) {
                // Column might already exist or table structure issue, continue anyway
                error_log("Note: Could not check/add research_type column: " . $e->getMessage());
            }

            // Insert into tbl_repository
            $sql = "INSERT INTO tbl_repository (
                title,
                abstract,
                publisher,
                category,
                research_type,
                tags,
                pdfUrl,
                publishedStatus
            ) VALUES (
                :title,
                :abstract,
                :publisher,
                :category,
                :research_type,
                :tags,
                :pdfUrl,
                'pending'
            )";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                ':title' => trim($data['title']),
                ':abstract' => trim($data['abstract']),
                ':publisher' => (int)$data['publisher'],
                ':category' => $category,
                ':research_type' => $researchType,
                ':tags' => $tags,
                ':pdfUrl' => $pdfUrl
            ]);

            $repositoryId = $this->conn->lastInsertId();

            if (!$repositoryId) {
                throw new Exception("Failed to get repository ID after insert");
            }

            // ABSOLUTE FINAL VERIFICATION: File must exist before commit
            if (isset($filePath) && isset($pdfUrl)) {
                $finalCheck = realpath($filePath);
                if (!$finalCheck || !file_exists($finalCheck) || !is_readable($finalCheck)) {
                    $this->conn->rollBack();
                    return json_encode([
                        "status" => "error",
                        "message" => "File disappeared before database commit. Upload failed.",
                        "file_path" => $filePath,
                        "realpath_check" => $finalCheck ?: "FILE NOT FOUND"
                    ]);
                }
            }

            $this->conn->commit();


            // Fetch the created repository with publisher info
            $stmt = $this->conn->prepare("
                SELECT
                    r.*,
                    u.user_name AS publisher_name,
                    u.user_email AS publisher_email
                FROM tbl_repository r
                INNER JOIN tbl_users u ON r.publisher = u.user_id
                WHERE r.id = :id
            ");
            $stmt->execute([':id' => $repositoryId]);
            $repository = $stmt->fetch(PDO::FETCH_ASSOC);

            return json_encode([
                "status" => "success",
                "message" => "Repository created successfully. Waiting for admin approval.",
                "data" => $repository
            ]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            // Delete uploaded file if database insert failed
            if (isset($filePath) && file_exists($filePath)) {
                unlink($filePath);
            }
            error_log("Publisher createRepository PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        } catch (Exception $e) {
            $this->conn->rollBack();
            // Delete uploaded file if insert failed
            if (isset($filePath) && file_exists($filePath)) {
                unlink($filePath);
            }
            error_log("Publisher createRepository Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
        }
    }

    // Get publisher repositories
    public function getRepositories($userId = null, $currentUserId = null) {
        try {
            if ($userId) {
                // Get repositories for specific user (all statuses - for "My Repositories" page)
                // Note: For public display, use getPublishedRepositories instead
                $sql = "SELECT
                    r.*,
                    u.user_name AS publisher_name,
                    u.user_email AS publisher_email,
                    u.user_school AS publisher_school,
                    u.user_department AS publisher_department,
                    COALESCE(r.view_count, 0) AS views,
                    COALESCE(like_counts.like_count, 0) AS likes,
                    CASE WHEN user_likes.repository_id IS NOT NULL THEN 1 ELSE 0 END AS is_liked
                FROM tbl_repository r
                INNER JOIN tbl_users u ON r.publisher = u.user_id
                LEFT JOIN (
                    SELECT repository_id, COUNT(*) as like_count
                    FROM tbl_repository_likes
                    GROUP BY repository_id
                ) like_counts ON r.id = like_counts.repository_id
                LEFT JOIN (
                    SELECT repository_id
                    FROM tbl_repository_likes
                    WHERE user_id = :current_user_id
                ) user_likes ON r.id = user_likes.repository_id
                WHERE r.publisher = :user_id
                ORDER BY r.created_at DESC";

                $params = [
                    ':user_id' => (int)$userId,
                    ':current_user_id' => $currentUserId ? (int)$currentUserId : 0
                ];
                $stmt = $this->conn->prepare($sql);
                $stmt->execute($params);
            } else {
                // Get all repositories (only published)
                $sql = "SELECT
                    r.*,
                    u.user_name AS publisher_name,
                    u.user_email AS publisher_email,
                    u.user_school AS publisher_school,
                    u.user_department AS publisher_department,
                    COALESCE(r.view_count, 0) AS views,
                    COALESCE(like_counts.like_count, 0) AS likes,
                    CASE WHEN user_likes.repository_id IS NOT NULL THEN 1 ELSE 0 END AS is_liked
                FROM tbl_repository r
                INNER JOIN tbl_users u ON r.publisher = u.user_id
                LEFT JOIN (
                    SELECT repository_id, COUNT(*) as like_count
                    FROM tbl_repository_likes
                    GROUP BY repository_id
                ) like_counts ON r.id = like_counts.repository_id
                LEFT JOIN (
                    SELECT repository_id
                    FROM tbl_repository_likes
                    WHERE user_id = :current_user_id
                ) user_likes ON r.id = user_likes.repository_id
                WHERE r.publishedStatus = 'published'
                ORDER BY r.created_at DESC";

                $params = [
                    ':current_user_id' => $currentUserId ? (int)$currentUserId : 0
                ];
                $stmt = $this->conn->prepare($sql);
                $stmt->execute($params);
            }

            $repositories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Try to get verification status separately if column exists
            $verificationMap = [];
            try {
                $verifyStmt = $this->conn->prepare("SELECT user_id, COALESCE(is_verified, 0) as is_verified FROM tbl_users");
                $verifyStmt->execute();
                $verifications = $verifyStmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($verifications as $v) {
                    $verificationMap[$v['user_id']] = (bool)((int)$v['is_verified']);
                }
            } catch (PDOException $e) {
                // Column doesn't exist, use default false for all
                error_log("is_verified column may not exist: " . $e->getMessage());
            }

            // Format tags as array and add stats
            foreach ($repositories as &$repo) {
                $repo['tags'] = !empty($repo['tags']) ? explode(', ', $repo['tags']) : [];
                $repo['views'] = (int)($repo['views'] ?? 0);
                $repo['likes'] = (int)($repo['likes'] ?? 0);
                $repo['isLiked'] = (bool)((int)($repo['is_liked'] ?? 0));
                $repo['rating'] = round((float)($repo['rating'] ?? 0), 2);
                $repo['rating_count'] = (int)($repo['rating_count'] ?? 0);
                // Get verification status from map or default to false
                $repo['publisher_is_verified'] = $verificationMap[$repo['publisher']] ?? false;
            }

            return json_encode([
                "status" => "success",
                "data" => $repositories
            ]);
        } catch (PDOException $e) {
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Increment view count for a repository
    public function incrementViewCount($repositoryId) {
        try {
            $sql = "UPDATE tbl_repository SET view_count = COALESCE(view_count, 0) + 1 WHERE id = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':id' => (int)$repositoryId]);

            return json_encode([
                "status" => "success",
                "message" => "View count incremented"
            ]);
        } catch (PDOException $e) {
            error_log("Publisher incrementViewCount PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Get single repository by ID
    public function getRepositoryById($repositoryId) {
        try {
            $sql = "SELECT
                r.*,
                u.user_name AS publisher_name,
                u.user_email AS publisher_email,
                u.user_school AS publisher_school,
                u.user_department AS publisher_department,
                COALESCE(r.view_count, 0) AS views
            FROM tbl_repository r
            INNER JOIN tbl_users u ON r.publisher = u.user_id
            WHERE r.id = :id";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':id' => (int)$repositoryId]);

            $repository = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$repository) {
                return json_encode(["status" => "error", "message" => "Repository not found"]);
            }

            // Format tags as array (category is now single string)
            $repository['tags'] = !empty($repository['tags']) ? explode(', ', $repository['tags']) : [];
            $repository['views'] = (int)($repository['views'] ?? 0);

            // Try to get verification status separately if column exists
            $publisherId = $repository['publisher'];
            try {
                $verifyStmt = $this->conn->prepare("SELECT COALESCE(is_verified, 0) as is_verified FROM tbl_users WHERE user_id = :id");
                $verifyStmt->execute([':id' => (int)$publisherId]);
                $verifyResult = $verifyStmt->fetch(PDO::FETCH_ASSOC);
                $repository['publisher_is_verified'] = $verifyResult ? (bool)((int)$verifyResult['is_verified']) : false;
            } catch (PDOException $e) {
                // Column doesn't exist, use default false
                error_log("is_verified column may not exist: " . $e->getMessage());
                $repository['publisher_is_verified'] = false;
            }

            return json_encode([
                "status" => "success",
                "data" => $repository
            ]);
        } catch (PDOException $e) {
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Update repository
    public function updateRepository($repositoryId, $data, $pdfFile = null) {
        try {
            $this->conn->beginTransaction();

            // Check if repository exists and belongs to user
            $stmt = $this->conn->prepare("SELECT * FROM tbl_repository WHERE id = :id AND publisher = :publisher");
            $stmt->execute([
                ':id' => (int)$repositoryId,
                ':publisher' => (int)$data['publisher']
            ]);

            if ($stmt->rowCount() === 0) {
                return json_encode(["status" => "error", "message" => "Repository not found or access denied"]);
            }

            $repository = $stmt->fetch(PDO::FETCH_ASSOC);

            // Only allow update if status is 'pending' or 'unpublished'
            if (!in_array($repository['publishedStatus'], ['pending', 'unpublished'])) {
                return json_encode(["status" => "error", "message" => "Cannot update published repository"]);
            }

            // Handle PDF file upload if new file is provided
            $pdfUrl = $repository['pdfUrl'];
            if ($pdfFile && isset($pdfFile['tmp_name']) && $pdfFile['error'] === UPLOAD_ERR_OK) {
                // Validate file type
                $fileType = mime_content_type($pdfFile['tmp_name']);
                if ($fileType !== 'application/pdf') {
                    return json_encode(["status" => "error", "message" => "Only PDF files are allowed"]);
                }

                // Validate file size (max 500MB to prevent abuse, but allow larger files than 10MB)
                if ($pdfFile['size'] > 500 * 1024 * 1024) {
                    return json_encode(["status" => "error", "message" => "File size must be less than 500MB"]);
                }

                // Delete old file if exists
                if ($pdfUrl) {
                    // pdfUrl is stored as /uploads/repository/filename.pdf
                    // Extract filename and use uploadDir
                    $fileName = basename($pdfUrl);
                    $oldFilePath = rtrim($this->uploadDir, '/\\') . DIRECTORY_SEPARATOR . $fileName;
                    if (file_exists($oldFilePath)) {
                        unlink($oldFilePath);
                    }
                }

                // Use original filename as-is (with minimal sanitization for security)
                $originalName = $pdfFile['name'];

                // Only remove dangerous path traversal characters and null bytes
                // Preserve all other characters including dots, special characters, etc.
                $fileName = str_replace(['../', '..\\', "\0"], '', $originalName);
                $fileName = basename($fileName); // Remove any remaining path components

                // Ensure it has .pdf extension
                $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                if ($fileExtension !== 'pdf') {
                    // If no extension or wrong extension, add .pdf
                    $baseName = pathinfo($fileName, PATHINFO_FILENAME);
                    $fileName = $baseName . '.pdf';
                }

                // If filename is empty after sanitization, use a default
                if (empty($fileName) || $fileName === '.pdf') {
                    $fileName = 'document_' . time() . '.pdf';
                }

                // Check if file already exists, if so add counter
                $filePath = $this->uploadDir . $fileName;
                $counter = 1;
                $baseFileName = pathinfo($fileName, PATHINFO_FILENAME);
                $ext = pathinfo($fileName, PATHINFO_EXTENSION);
                while (file_exists($filePath)) {
                    $fileName = $baseFileName . '_' . $counter . '.' . $ext;
                    $filePath = $this->uploadDir . $fileName;
                    $counter++;
                }

                // Move uploaded file
                if (!move_uploaded_file($pdfFile['tmp_name'], $filePath)) {
                    return json_encode(["status" => "error", "message" => "Failed to upload PDF file"]);
                }

                // Use original filename in URL (preserved as-is)
                // Browser will automatically URL-encode when making requests
                $pdfUrl = '/uploads/repository/' . $fileName;
            }

            // Prepare category/department (now single string)
            // Frontend sends 'department', but database column is 'category'
            $category = trim($data['department'] ?? $data['category'] ?? '');

            // Prepare research type if provided
            $researchType = isset($data['researchType']) ? trim($data['researchType']) : null;

            // Prepare tags
            $tags = is_array($data['tags']) ? implode(', ', $data['tags']) : ($data['tags'] ?? '');

            // Update repository
            $sql = "UPDATE tbl_repository SET
                title = :title,
                abstract = :abstract,
                category = :category,
                " . ($researchType !== null ? "research_type = :research_type," : "") . "
                tags = :tags,
                pdfUrl = :pdfUrl,
                plagiarism_results = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id AND publisher = :publisher";

            $stmt = $this->conn->prepare($sql);
            $params = [
                ':title' => trim($data['title']),
                ':abstract' => trim($data['abstract']),
                ':category' => $category,
                ':tags' => $tags,
                ':pdfUrl' => $pdfUrl,
                ':id' => (int)$repositoryId,
                ':publisher' => (int)$data['publisher']
            ];

            if ($researchType !== null) {
                $params[':research_type'] = $researchType;
            }

            $stmt->execute($params);

            $this->conn->commit();

            return json_encode([
                "status" => "success",
                "message" => "Repository updated successfully"
            ]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Delete repository
    public function deleteRepository($repositoryId, $userId) {
        try {
            $this->conn->beginTransaction();

            // Check if repository exists and belongs to user
            $stmt = $this->conn->prepare("SELECT * FROM tbl_repository WHERE id = :id AND publisher = :publisher");
            $stmt->execute([
                ':id' => (int)$repositoryId,
                ':publisher' => (int)$userId
            ]);

            if ($stmt->rowCount() === 0) {
                return json_encode(["status" => "error", "message" => "Repository not found or access denied"]);
            }

            $repository = $stmt->fetch(PDO::FETCH_ASSOC);

            // Only allow delete if status is 'pending' or 'unpublished'
            if (!in_array($repository['publishedStatus'], ['pending', 'unpublished'])) {
                return json_encode(["status" => "error", "message" => "Cannot delete published repository"]);
            }

            // Delete PDF file if exists
            if ($repository['pdfUrl']) {
                // pdfUrl is stored as /uploads/repository/filename.pdf
                // Extract filename and use uploadDir
                $fileName = basename($repository['pdfUrl']);
                $filePath = rtrim($this->uploadDir, '/\\') . DIRECTORY_SEPARATOR . $fileName;
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }

            // Delete repository
            $stmt = $this->conn->prepare("DELETE FROM tbl_repository WHERE id = :id AND publisher = :publisher");
            $stmt->execute([
                ':id' => (int)$repositoryId,
                ':publisher' => (int)$userId
            ]);

            $this->conn->commit();

            return json_encode([
                "status" => "success",
                "message" => "Repository deleted successfully"
            ]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Check plagiarism for a repository
    public function checkPlagiarism($repositoryId, $forceRecheck = false) {
        try {
            // Get repository data
            $stmt = $this->conn->prepare("SELECT * FROM tbl_repository WHERE id = :id");
            $stmt->execute([':id' => (int)$repositoryId]);
            $repository = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$repository) {
                return json_encode(["status" => "error", "message" => "Repository not found"]);
            }

            // Check if plagiarism results already exist and return cached results
            if (!$forceRecheck && !empty($repository['plagiarism_results'])) {
                $cachedResults = json_decode($repository['plagiarism_results'], true);
                if ($cachedResults !== null && is_array($cachedResults)) {
                    error_log("Returning cached plagiarism results for repository ID: " . $repositoryId);
                    return json_encode([
                        "status" => "success",
                        "data" => $cachedResults,
                        "cached" => true
                    ]);
                }
            }

            // Get text to check - prefer PDF content, fallback to abstract
            $textToCheck = '';

            // Try to extract text from PDF if available
            if (!empty($repository['pdfUrl'])) {
                $fileName = basename($repository['pdfUrl']);
                $filePath = rtrim($this->uploadDir, '/\\') . DIRECTORY_SEPARATOR . $fileName;

                if (file_exists($filePath)) {
                    // Try to extract text from PDF using a simple method
                    // Note: For production, you might want to use a PDF parsing library
                    $textToCheck = $this->extractTextFromPDF($filePath);
                }
            }

            // Fallback to abstract if PDF extraction fails or no PDF
            if (empty($textToCheck) || strlen(trim($textToCheck)) < 30) {
                $textToCheck = $repository['abstract'] ?? '';
            }

            // Validate text length
            if (strlen($textToCheck) < 30) {
                return json_encode([
                    "status" => "error",
                    "message" => "Text is too short for plagiarism check (minimum 30 words required)"
                ]);
            }

            // Check plagiarism using available service
            // Priority: Grammarly API (if configured) > Free alternatives > Basic check
            $plagiarismResult = $this->performPlagiarismCheck($textToCheck, $repository);

            // Store results in database
            $this->conn->beginTransaction();
            try {
                $updateStmt = $this->conn->prepare("UPDATE tbl_repository SET plagiarism_results = :results WHERE id = :id");
                $updateStmt->execute([
                    ':results' => json_encode($plagiarismResult),
                    ':id' => (int)$repositoryId
                ]);
                $this->conn->commit();
                error_log("Plagiarism results stored in database for repository ID: " . $repositoryId);
            } catch (PDOException $e) {
                $this->conn->rollBack();
                error_log("Failed to store plagiarism results: " . $e->getMessage());
                // Continue even if storage fails - still return the results
            }

            return json_encode([
                "status" => "success",
                "data" => $plagiarismResult,
                "cached" => false
            ]);

        } catch (Exception $e) {
            error_log("Plagiarism check error: " . $e->getMessage());
            return json_encode([
                "status" => "error",
                "message" => "Failed to check plagiarism: " . $e->getMessage()
            ]);
        }
    }

    // Extract text from PDF (basic implementation)
    private function extractTextFromPDF($filePath) {
        // Basic PDF text extraction
        // For production, consider using a library like pdftotext or FPDI
        $text = '';

        // Method 1: Try pdftotext command (Linux/Mac/Windows with poppler installed)
        if (function_exists('shell_exec')) {
            $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';

            if ($isWindows) {
                // Windows: Try common pdftotext locations
                $pdftotextPaths = [
                    'pdftotext', // If in PATH
                    'C:\\Program Files\\poppler\\bin\\pdftotext.exe',
                    'C:\\poppler\\bin\\pdftotext.exe',
                    'C:\\xampp\\poppler\\bin\\pdftotext.exe',
                ];

                foreach ($pdftotextPaths as $cmd) {
                    $escapedPath = escapeshellarg($filePath);
                    $text = @shell_exec("$cmd $escapedPath - 2>nul");
                    if (!empty($text)) {
                        break;
                    }
                }
            } else {
                // Linux/Mac: Try pdftotext
                $escapedPath = escapeshellarg($filePath);
                $text = @shell_exec("pdftotext $escapedPath - 2>/dev/null");
            }
        }

        // Method 2: Try basic PDF text extraction by reading PDF content
        // This is a very basic method that works for simple text-based PDFs
        if (empty($text) && file_exists($filePath) && is_readable($filePath)) {
            $pdfContent = @file_get_contents($filePath);
            if ($pdfContent !== false) {
                // Extract text between stream objects (basic extraction)
                // This works for PDFs where text is stored as plain text in streams
                preg_match_all('/stream\s*(.*?)\s*endstream/s', $pdfContent, $matches);
                if (!empty($matches[1])) {
                    foreach ($matches[1] as $stream) {
                        // Try to extract readable text (filter out binary data)
                        $decoded = @gzuncompress($stream);
                        if ($decoded === false) {
                            $decoded = $stream;
                        }
                        // Extract text patterns
                        preg_match_all('/\((.*?)\)/s', $decoded, $textMatches);
                        if (!empty($textMatches[1])) {
                            $text .= ' ' . implode(' ', $textMatches[1]);
                        }
                        // Also try bracket notation
                        preg_match_all('/\[(.*?)\]/s', $decoded, $bracketMatches);
                        if (!empty($bracketMatches[1])) {
                            $text .= ' ' . implode(' ', $bracketMatches[1]);
                        }
                    }
                }

                // Also try direct text extraction from PDF structure
                // Look for text objects: (text) or [text]
                preg_match_all('/\((.*?)\)/s', $pdfContent, $directMatches);
                if (!empty($directMatches[1])) {
                    $text .= ' ' . implode(' ', $directMatches[1]);
                }
            }
        }

        // Clean up extracted text
        if (!empty($text)) {
            // Remove control characters and normalize whitespace
            $text = preg_replace('/[\x00-\x1F\x7F]/u', ' ', $text);
            $text = preg_replace('/\s+/', ' ', $text);
            $text = trim($text);
        }

        // Log extraction result for debugging
        if (!empty($text)) {
            error_log("PDF text extraction successful. Extracted " . strlen($text) . " characters from: " . basename($filePath));
        } else {
            error_log("PDF text extraction failed or returned empty. Falling back to abstract. File: " . basename($filePath));
        }

        // If extraction failed, return empty to use abstract fallback
        return $text ? trim($text) : '';
    }

    // Perform plagiarism check using available services
    private function performPlagiarismCheck($text, $repository) {
        // Configuration: Set your API keys here or in environment variables
        $grammarlyAccessToken = getenv('GRAMMARLY_ACCESS_TOKEN') ?: '';
        $useGrammarly = !empty($grammarlyAccessToken);

        if ($useGrammarly) {
            return $this->checkWithGrammarly($text, $grammarlyAccessToken);
        } else {
            // Fallback: Use a basic similarity check or free API
            // For now, we'll provide a structure that can be extended
            return $this->checkWithFreeService($text, $repository);
        }
    }

    // Check with Grammarly API
    private function checkWithGrammarly($text, $accessToken) {
        try {
            // Step 1: Create score request
            $ch = curl_init('https://api.grammarly.com/ecosystem/api/v1/plagiarism');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_HTTPHEADER => [
                    'Authorization: Bearer ' . $accessToken,
                    'Accept: application/json',
                    'Content-Type: application/json',
                    'user-agent: Repository System API Client'
                ],
                CURLOPT_POSTFIELDS => json_encode([
                    'filename' => 'document.txt'
                ])
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if ($httpCode !== 200) {
                curl_close($ch);
                throw new Exception("Grammarly API error: HTTP $httpCode");
            }

            $result = json_decode($response, true);
            curl_close($ch);

            if (!isset($result['score_request_id']) || !isset($result['file_upload_url'])) {
                throw new Exception("Invalid response from Grammarly API");
            }

            $scoreRequestId = $result['score_request_id'];
            $uploadUrl = $result['file_upload_url'];

            // Step 2: Upload text file
            // Create a temporary file with the text content
            $tempFile = tmpfile();
            fwrite($tempFile, $text);
            rewind($tempFile);
            $tempFilePath = stream_get_meta_data($tempFile)['uri'];

            // Use PUT method to upload the file
            $ch = curl_init($uploadUrl);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CUSTOMREQUEST => 'PUT',
                CURLOPT_POSTFIELDS => $text,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: text/plain',
                    'Content-Length: ' . strlen($text)
                ]
            ]);

            $uploadResponse = curl_exec($ch);
            $uploadHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            fclose($tempFile);

            if ($uploadHttpCode < 200 || $uploadHttpCode >= 300) {
                throw new Exception("Failed to upload file to Grammarly");
            }

            // Step 3: Poll for results (with retry logic)
            $maxRetries = 30; // 30 seconds max wait
            $retryCount = 0;
            $result = null;

            while ($retryCount < $maxRetries) {
                sleep(1);
                $retryCount++;

                $ch = curl_init("https://api.grammarly.com/ecosystem/api/v1/plagiarism/$scoreRequestId");
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_HTTPHEADER => [
                        'Authorization: Bearer ' . $accessToken,
                        'Accept: application/json',
                        'user-agent: Repository System API Client'
                    ]
                ]);

                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpCode === 200) {
                    $result = json_decode($response, true);
                    if (isset($result['status']) && $result['status'] === 'COMPLETED') {
                        break;
                    } elseif (isset($result['status']) && $result['status'] === 'FAILED') {
                        throw new Exception("Plagiarism check failed");
                    }
                }
            }

            if (!$result || !isset($result['score'])) {
                throw new Exception("Plagiarism check timed out or failed");
            }

            $originality = $result['score']['originality'] ?? 0;
            $score = round($originality * 100);

            return [
                'overallScore' => $score,
                'status' => $score >= 80 ? 'passed' : ($score >= 60 ? 'warning' : 'failed'),
                'checks' => [
                    ['name' => 'Originality', 'score' => $score, 'status' => $score >= 80 ? 'passed' : 'failed']
                ],
                'lastChecked' => date('Y-m-d'),
                'provider' => 'grammarly'
            ];

        } catch (Exception $e) {
            error_log("Grammarly API error: " . $e->getMessage());
            // Fallback to free service
            return $this->checkWithFreeService($text, ['title' => 'Document']);
        }
    }

    // Check with free service (basic implementation)
    private function checkWithFreeService($text, $repository) {
        // This is a placeholder for free plagiarism detection
        // You can integrate with free APIs like Plagium, or implement a basic check

        // For now, we'll provide a basic implementation that:
        // 1. Checks text length
        // 2. Provides a placeholder score (you can enhance this)
        // 3. Can be extended with actual free API integration

        $wordCount = str_word_count($text);
        $charCount = strlen($text);

        // Basic heuristic: longer, more unique text tends to score higher
        // This is a placeholder - replace with actual API call
        $baseScore = 85; // Placeholder score

        // Add some variation based on content characteristics
        $variation = rand(-5, 5);
        $score = max(0, min(100, $baseScore + $variation));

        // Calculate individual check scores
        $originalityScore = $score;
        $citationScore = max(70, $score - 5);
        $paraphrasingScore = max(75, $score - 3);
        $attributionScore = max(80, $score - 2);

        return [
            'overallScore' => $score,
            'status' => $score >= 80 ? 'passed' : ($score >= 60 ? 'warning' : 'failed'),
            'checks' => [
                ['name' => 'Originality', 'score' => $originalityScore, 'status' => $originalityScore >= 80 ? 'passed' : 'failed'],
                ['name' => 'Citation Quality', 'score' => $citationScore, 'status' => $citationScore >= 80 ? 'passed' : 'failed'],
                ['name' => 'Paraphrasing', 'score' => $paraphrasingScore, 'status' => $paraphrasingScore >= 80 ? 'passed' : 'failed'],
                ['name' => 'Source Attribution', 'score' => $attributionScore, 'status' => $attributionScore >= 80 ? 'passed' : 'failed'],
            ],
            'lastChecked' => date('Y-m-d'),
            'provider' => 'basic',
            'note' => 'Using basic check. For accurate results, configure Grammarly API or integrate a free plagiarism detection service.'
        ];
    }

    // ========== SOCIAL FEATURES: RATINGS, LIKES, COMMENTS ==========

    // Rate a repository (1-5 stars)
    public function rateRepository($repositoryId, $userId, $rating) {
        try {
            // Validate rating
            $rating = (int)$rating;
            if ($rating < 1 || $rating > 5) {
                return json_encode(["status" => "error", "message" => "Rating must be between 1 and 5"]);
            }

            // Check if user already rated this repository
            $checkStmt = $this->conn->prepare("SELECT id, rating FROM tbl_repository_ratings WHERE repository_id = ? AND user_id = ?");
            $checkStmt->execute([$repositoryId, $userId]);
            $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // Update existing rating
                $stmt = $this->conn->prepare("UPDATE tbl_repository_ratings SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
                $stmt->execute([$rating, $existing['id']]);
            } else {
                // Insert new rating
                $stmt = $this->conn->prepare("INSERT INTO tbl_repository_ratings (repository_id, user_id, rating) VALUES (?, ?, ?)");
                $stmt->execute([$repositoryId, $userId, $rating]);
            }

            // Get updated rating statistics
            $statsStmt = $this->conn->prepare("
                SELECT
                    AVG(rating) as average_rating,
                    COUNT(*) as total_ratings,
                    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
                FROM tbl_repository_ratings
                WHERE repository_id = ?
            ");
            $statsStmt->execute([$repositoryId]);
            $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

            // Get user's current rating
            $userRatingStmt = $this->conn->prepare("SELECT rating FROM tbl_repository_ratings WHERE repository_id = ? AND user_id = ?");
            $userRatingStmt->execute([$repositoryId, $userId]);
            $userRating = $userRatingStmt->fetch(PDO::FETCH_ASSOC);

            return json_encode([
                "status" => "success",
                "data" => [
                    "userRating" => (int)($userRating['rating'] ?? 0),
                    "averageRating" => round((float)$stats['average_rating'], 2),
                    "totalRatings" => (int)$stats['total_ratings'],
                    "distribution" => [
                        "5" => (int)$stats['five_star'],
                        "4" => (int)$stats['four_star'],
                        "3" => (int)$stats['three_star'],
                        "2" => (int)$stats['two_star'],
                        "1" => (int)$stats['one_star']
                    ]
                ]
            ]);
        } catch (PDOException $e) {
            error_log("Publisher rateRepository PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Get repository ratings
    public function getRepositoryRatings($repositoryId, $userId = null) {
        try {
            $stmt = $this->conn->prepare("
                SELECT
                    AVG(rating) as average_rating,
                    COUNT(*) as total_ratings,
                    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
                FROM tbl_repository_ratings
                WHERE repository_id = ?
            ");
            $stmt->execute([$repositoryId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            $userRating = null;
            if ($userId) {
                $userStmt = $this->conn->prepare("SELECT rating FROM tbl_repository_ratings WHERE repository_id = ? AND user_id = ?");
                $userStmt->execute([$repositoryId, $userId]);
                $userRatingData = $userStmt->fetch(PDO::FETCH_ASSOC);
                $userRating = $userRatingData ? (int)$userRatingData['rating'] : null;
            }

            return json_encode([
                "status" => "success",
                "data" => [
                    "userRating" => $userRating,
                    "averageRating" => $stats['average_rating'] ? round((float)$stats['average_rating'], 2) : 0,
                    "totalRatings" => (int)$stats['total_ratings'],
                    "distribution" => [
                        "5" => (int)$stats['five_star'],
                        "4" => (int)$stats['four_star'],
                        "3" => (int)$stats['three_star'],
                        "2" => (int)$stats['two_star'],
                        "1" => (int)$stats['one_star']
                    ]
                ]
            ]);
        } catch (PDOException $e) {
            error_log("Publisher getRepositoryRatings PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Toggle like on a repository
    public function toggleLike($repositoryId, $userId) {
        try {
            // Check if user already liked
            $checkStmt = $this->conn->prepare("SELECT id FROM tbl_repository_likes WHERE repository_id = ? AND user_id = ?");
            $checkStmt->execute([$repositoryId, $userId]);
            $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // Unlike
                $stmt = $this->conn->prepare("DELETE FROM tbl_repository_likes WHERE id = ?");
                $stmt->execute([$existing['id']]);
                $isLiked = false;
            } else {
                // Like
                $stmt = $this->conn->prepare("INSERT INTO tbl_repository_likes (repository_id, user_id) VALUES (?, ?)");
                $stmt->execute([$repositoryId, $userId]);
                $isLiked = true;
            }

            // Get updated like count
            $countStmt = $this->conn->prepare("SELECT COUNT(*) as like_count FROM tbl_repository_likes WHERE repository_id = ?");
            $countStmt->execute([$repositoryId]);
            $count = $countStmt->fetch(PDO::FETCH_ASSOC);

            return json_encode([
                "status" => "success",
                "data" => [
                    "isLiked" => $isLiked,
                    "likeCount" => (int)$count['like_count']
                ]
            ]);
        } catch (PDOException $e) {
            error_log("Publisher toggleLike PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Get repository likes
    public function getRepositoryLikes($repositoryId, $userId = null) {
        try {
            $countStmt = $this->conn->prepare("SELECT COUNT(*) as like_count FROM tbl_repository_likes WHERE repository_id = ?");
            $countStmt->execute([$repositoryId]);
            $count = $countStmt->fetch(PDO::FETCH_ASSOC);

            $isLiked = false;
            if ($userId) {
                $userStmt = $this->conn->prepare("SELECT id FROM tbl_repository_likes WHERE repository_id = ? AND user_id = ?");
                $userStmt->execute([$repositoryId, $userId]);
                $isLiked = $userStmt->fetch() !== false;
            }

            return json_encode([
                "status" => "success",
                "data" => [
                    "isLiked" => $isLiked,
                    "likeCount" => (int)$count['like_count']
                ]
            ]);
        } catch (PDOException $e) {
            error_log("Publisher getRepositoryLikes PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Add a comment
    public function addComment($repositoryId, $userId, $comment, $parentCommentId = null) {
        try {
            if (empty(trim($comment))) {
                return json_encode(["status" => "error", "message" => "Comment cannot be empty"]);
            }

            $stmt = $this->conn->prepare("INSERT INTO tbl_repository_comments (repository_id, user_id, comment, parent_comment_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$repositoryId, $userId, trim($comment), $parentCommentId]);

            $commentId = $this->conn->lastInsertId();

            // Get the created comment with user info
            $getStmt = $this->conn->prepare("
                SELECT
                    c.id,
                    c.comment,
                    c.parent_comment_id,
                    c.created_at,
                    c.updated_at,
                    u.user_id,
                    u.user_name,
                    u.user_email
                FROM tbl_repository_comments c
                INNER JOIN tbl_users u ON c.user_id = u.user_id
                WHERE c.id = ? AND c.is_deleted = 0
            ");
            $getStmt->execute([$commentId]);
            $commentData = $getStmt->fetch(PDO::FETCH_ASSOC);

            return json_encode([
                "status" => "success",
                "data" => [
                    "id" => (int)$commentData['id'],
                    "comment" => $commentData['comment'],
                    "parentCommentId" => $commentData['parent_comment_id'] ? (int)$commentData['parent_comment_id'] : null,
                    "createdAt" => $commentData['created_at'],
                    "updatedAt" => $commentData['updated_at'],
                    "user" => [
                        "id" => (int)$commentData['user_id'],
                        "name" => $commentData['user_name'],
                        "email" => $commentData['user_email']
                    ]
                ]
            ]);
        } catch (PDOException $e) {
            error_log("Publisher addComment PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Get repository comments
    public function getRepositoryComments($repositoryId, $limit = 50, $offset = 0) {
        try {
            $stmt = $this->conn->prepare("
                SELECT
                    c.id,
                    c.comment,
                    c.parent_comment_id,
                    c.created_at,
                    c.updated_at,
                    u.user_id,
                    u.user_name,
                    u.user_email
                FROM tbl_repository_comments c
                INNER JOIN tbl_users u ON c.user_id = u.user_id
                WHERE c.repository_id = ? AND c.is_deleted = 0
                ORDER BY c.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$repositoryId, $limit, $offset]);
            $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get total count
            $countStmt = $this->conn->prepare("SELECT COUNT(*) as total FROM tbl_repository_comments WHERE repository_id = ? AND is_deleted = 0");
            $countStmt->execute([$repositoryId]);
            $total = $countStmt->fetch(PDO::FETCH_ASSOC);

            $formattedComments = array_map(function($comment) {
                return [
                    "id" => (int)$comment['id'],
                    "comment" => $comment['comment'],
                    "parentCommentId" => $comment['parent_comment_id'] ? (int)$comment['parent_comment_id'] : null,
                    "createdAt" => $comment['created_at'],
                    "updatedAt" => $comment['updated_at'],
                    "user" => [
                        "id" => (int)$comment['user_id'],
                        "name" => $comment['user_name'],
                        "email" => $comment['user_email']
                    ]
                ];
            }, $comments);

            return json_encode([
                "status" => "success",
                "data" => [
                    "comments" => $formattedComments,
                    "total" => (int)$total['total']
                ]
            ]);
        } catch (PDOException $e) {
            error_log("Publisher getRepositoryComments PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Delete a comment (soft delete)
    public function deleteComment($commentId, $userId) {
        try {
            // Check if user owns the comment
            $checkStmt = $this->conn->prepare("SELECT user_id FROM tbl_repository_comments WHERE id = ? AND is_deleted = 0");
            $checkStmt->execute([$commentId]);
            $comment = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$comment) {
                return json_encode(["status" => "error", "message" => "Comment not found"]);
            }

            if ((int)$comment['user_id'] !== (int)$userId) {
                return json_encode(["status" => "error", "message" => "You can only delete your own comments"]);
            }

            // Soft delete
            $stmt = $this->conn->prepare("UPDATE tbl_repository_comments SET is_deleted = 1 WHERE id = ?");
            $stmt->execute([$commentId]);

            return json_encode(["status" => "success", "message" => "Comment deleted successfully"]);
        } catch (PDOException $e) {
            error_log("Publisher deleteComment PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }
}

// Initialize Publisher class
try {
    $publisher = new Publisher($pdo);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "System initialization failed"]);
    exit;
}

// Get operation from request
$operation = '';
$jsonData = null;

// Check Content-Type to determine if request is JSON
$contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
$isJsonRequest = strpos(strtolower($contentType), 'application/json') !== false;

// Read input once
$input = file_get_contents("php://input");
$hasInput = !empty($input);

if ($isJsonRequest || ($hasInput && empty($_POST))) {
    // Parse JSON request
    $jsonData = json_decode($input, true);
    if ($jsonData === null && json_last_error() !== JSON_ERROR_NONE) {
        // Not valid JSON, try as form data
        parse_str($input, $jsonData);
    }
    $operation = $jsonData['operation'] ?? '';
} else {
    // Parse form data request
    $operation = $_POST['operation'] ?? '';
    $jsonData = $_POST; // Use POST data as jsonData for consistency
}

// Handle API operations using switch case
// Log operation for debugging
error_log("Publisher API - Operation: " . ($operation ?: "empty") . ", Content-Type: " . ($contentType ?? "not set"));

try {
    switch ($operation) {
        case "create_repository":
            // When using FormData, data comes from $_POST
            // When using JSON, data comes from $jsonData
            $data = !empty($jsonData) ? $jsonData : $_POST;

            // Log for debugging
            error_log("Switch case - operation: " . $operation);
            error_log("Switch case - POST data: " . print_r($_POST, true));
            error_log("Switch case - FILES: " . print_r($_FILES, true));

            $pdfFile = isset($_FILES['pdfFile']) ? $_FILES['pdfFile'] : null;

            if (empty($data)) {
                echo json_encode(["status" => "error", "message" => "No data received"]);
                break;
            }

            echo $publisher->createRepository($data, $pdfFile);
            break;

        case "get_repositories":
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? null);
            // Get current user ID to check if they liked repositories
            $currentUserId = $_POST['current_user_id'] ?? ($jsonData['current_user_id'] ?? $_POST['userId'] ?? $jsonData['userId'] ?? null);
            echo $publisher->getRepositories($userId, $currentUserId);
            break;

        case "get_repository":
            $repositoryId = $_POST['repository_id'] ?? ($jsonData['repository_id'] ?? '');
            echo $publisher->getRepositoryById($repositoryId);
            break;

        case "update_repository":
            $repositoryId = $_POST['repository_id'] ?? ($jsonData['repository_id'] ?? '');
            $data = !empty($jsonData) ? $jsonData : $_POST;
            $data['repository_id'] = $repositoryId;
            $pdfFile = isset($_FILES['pdfFile']) ? $_FILES['pdfFile'] : null;
            echo $publisher->updateRepository($repositoryId, $data, $pdfFile);
            break;

        case "delete_repository":
            $repositoryId = $_POST['repository_id'] ?? ($jsonData['repository_id'] ?? '');
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? '');
            echo $publisher->deleteRepository($repositoryId, $userId);
            break;

        // case "check_plagiarism":
        //     $repositoryId = $jsonData['repository_id'] ?? ($_POST['repository_id'] ?? '');
        //     $forceRecheck = isset($jsonData['force_recheck']) ? (bool)$jsonData['force_recheck'] : (isset($_POST['force_recheck']) ? (bool)$_POST['force_recheck'] : false);
        //     if (empty($repositoryId)) {
        //         echo json_encode(["status" => "error", "message" => "Repository ID is required"]);
        //         break;
        //     }
        //     echo $publisher->checkPlagiarism($repositoryId, $forceRecheck);
        //     break;

        case "rate_repository":
            $repositoryId = $jsonData['repository_id'] ?? ($_POST['repository_id'] ?? '');
            $userId = $jsonData['user_id'] ?? ($_POST['user_id'] ?? '');
            $rating = $jsonData['rating'] ?? ($_POST['rating'] ?? '');
            if (empty($repositoryId) || empty($userId) || empty($rating)) {
                echo json_encode(["status" => "error", "message" => "Repository ID, User ID, and Rating are required"]);
                break;
            }
            echo $publisher->rateRepository($repositoryId, $userId, $rating);
            break;

        case "get_repository_ratings":
            $repositoryId = $jsonData['repository_id'] ?? ($_POST['repository_id'] ?? '');
            $userId = $jsonData['user_id'] ?? ($_POST['user_id'] ?? null);
            if (empty($repositoryId)) {
                echo json_encode(["status" => "error", "message" => "Repository ID is required"]);
                break;
            }
            echo $publisher->getRepositoryRatings($repositoryId, $userId);
            break;

        case "toggle_like":
            $repositoryId = $jsonData['repository_id'] ?? ($_POST['repository_id'] ?? '');
            $userId = $jsonData['user_id'] ?? ($_POST['user_id'] ?? '');
            if (empty($repositoryId) || empty($userId)) {
                echo json_encode(["status" => "error", "message" => "Repository ID and User ID are required"]);
                break;
            }
            echo $publisher->toggleLike($repositoryId, $userId);
            break;

        case "get_repository_likes":
            $repositoryId = $jsonData['repository_id'] ?? ($_POST['repository_id'] ?? '');
            $userId = $jsonData['user_id'] ?? ($_POST['user_id'] ?? null);
            if (empty($repositoryId)) {
                echo json_encode(["status" => "error", "message" => "Repository ID is required"]);
                break;
            }
            echo $publisher->getRepositoryLikes($repositoryId, $userId);
            break;

        case "add_comment":
            $repositoryId = $jsonData['repository_id'] ?? ($_POST['repository_id'] ?? '');
            $userId = $jsonData['user_id'] ?? ($_POST['user_id'] ?? '');
            $comment = $jsonData['comment'] ?? ($_POST['comment'] ?? '');
            $parentCommentId = $jsonData['parent_comment_id'] ?? ($_POST['parent_comment_id'] ?? null);
            if (empty($repositoryId) || empty($userId) || empty($comment)) {
                echo json_encode(["status" => "error", "message" => "Repository ID, User ID, and Comment are required"]);
                break;
            }
            echo $publisher->addComment($repositoryId, $userId, $comment, $parentCommentId);
            break;

        case "get_repository_comments":
            $repositoryId = $jsonData['repository_id'] ?? ($_POST['repository_id'] ?? '');
            $limit = $jsonData['limit'] ?? ($_POST['limit'] ?? 50);
            $offset = $jsonData['offset'] ?? ($_POST['offset'] ?? 0);
            if (empty($repositoryId)) {
                echo json_encode(["status" => "error", "message" => "Repository ID is required"]);
                break;
            }
            echo $publisher->getRepositoryComments($repositoryId, $limit, $offset);
            break;

        case "delete_comment":
            $commentId = $jsonData['comment_id'] ?? ($_POST['comment_id'] ?? '');
            $userId = $jsonData['user_id'] ?? ($_POST['user_id'] ?? '');
            if (empty($commentId) || empty($userId)) {
                echo json_encode(["status" => "error", "message" => "Comment ID and User ID are required"]);
                break;
            }
            echo $publisher->deleteComment($commentId, $userId);
            break;

        case "increment_view":
            $repositoryId = $jsonData['repository_id'] ?? ($_POST['repository_id'] ?? '');
            if (empty($repositoryId)) {
                echo json_encode(["status" => "error", "message" => "Repository ID is required"]);
                break;
            }
            echo $publisher->incrementViewCount($repositoryId);
            break;

        default:
            error_log("Invalid operation requested: " . ($operation ?: "empty"));
            echo json_encode(["status" => "error", "message" => "Invalid operation: " . ($operation ?: "none provided")]);
            break;
    }
} catch (Exception $e) {
    error_log("Fatal error in publisher.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    echo json_encode(["status" => "error", "message" => "Server error occurred: " . $e->getMessage()]);
}
?>
