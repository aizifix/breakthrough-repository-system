<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Set timezone
date_default_timezone_set('Asia/Manila');

require_once 'db_connect.php';

// General class for public API endpoints
class General {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Get all published repositories (public view)
    public function getPublishedRepositories($filters = [], $userId = null) {
        try {
            // Check if is_verified column exists, if not use 0 as default
            $sql = "SELECT
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
                COALESCE(r.view_count, 0) AS views,
                COALESCE(like_counts.like_count, 0) AS likes,
                CASE WHEN user_likes.repository_id IS NOT NULL THEN 1 ELSE 0 END AS is_liked,
                0 AS publisher_is_verified
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
                WHERE user_id = :user_id
            ) user_likes ON r.id = user_likes.repository_id
            WHERE r.publishedStatus = 'published'";

            // Apply filters
            $params = [];

            // Filter by category
            if (!empty($filters['categories']) && is_array($filters['categories'])) {
                $categoryPlaceholders = [];
                foreach ($filters['categories'] as $index => $category) {
                    $placeholder = ':category' . $index;
                    $categoryPlaceholders[] = $placeholder;
                    $params[$placeholder] = '%' . $category . '%';
                }
                if (!empty($categoryPlaceholders)) {
                    $sql .= " AND (";
                    $sql .= implode(" OR ", array_map(function($p) {
                        return "r.category LIKE " . $p;
                    }, $categoryPlaceholders));
                    $sql .= ")";
                }
            }

            // Filter by keywords (search in title, abstract, tags)
            if (!empty($filters['keywords'])) {
                $sql .= " AND (
                    r.title LIKE :keywords OR
                    r.abstract LIKE :keywords OR
                    r.tags LIKE :keywords
                )";
                $params[':keywords'] = '%' . $filters['keywords'] . '%';
            }

            // Filter by year range
            $yearFrom = $filters['yearFrom'] ?? '';
            $yearTo = $filters['yearTo'] ?? '';

            if (!empty($yearFrom) || !empty($yearTo)) {
                if (!empty($yearFrom) && !empty($yearTo)) {
                    // Both from and to specified - range filter
                    $sql .= " AND YEAR(r.publishedDate) >= :yearFrom AND YEAR(r.publishedDate) <= :yearTo";
                    $params[':yearFrom'] = (int)$yearFrom;
                    $params[':yearTo'] = (int)$yearTo;
                } elseif (!empty($yearFrom)) {
                    // Only from year specified
                    $sql .= " AND YEAR(r.publishedDate) >= :yearFrom";
                    $params[':yearFrom'] = (int)$yearFrom;
                } elseif (!empty($yearTo)) {
                    // Only to year specified
                    $sql .= " AND YEAR(r.publishedDate) <= :yearTo";
                    $params[':yearTo'] = (int)$yearTo;
                }
            }

            $sql .= " ORDER BY r.publishedDate DESC, r.created_at DESC";

            // Add userId to params if provided
            if ($userId) {
                $params[':user_id'] = (int)$userId;
            } else {
                // If no userId, use a value that won't match any user_id (0 or -1)
                $params[':user_id'] = 0;
            }

            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);

            $repositories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Double-check: Filter to ONLY include published repositories (safety filter)
            $repositories = array_filter($repositories, function($repo) {
                return strtolower($repo['publishedStatus'] ?? '') === 'published';
            });

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

            // Format category and tags as arrays
            foreach ($repositories as &$repo) {
                $repo['category'] = !empty($repo['category']) ? explode(', ', $repo['category']) : [];
                $repo['tags'] = !empty($repo['tags']) ? explode(', ', $repo['tags']) : [];

                // Format publishedDate if null
                if (empty($repo['publishedDate'])) {
                    $repo['publishedDate'] = date('Y-m-d', strtotime($repo['created_at']));
                }

                // Format numeric fields (default to 0 if not available)
                $repo['views'] = (int)($repo['views'] ?? 0);
                $repo['likes'] = (int)($repo['likes'] ?? 0);
                $repo['isLiked'] = (bool)((int)($repo['is_liked'] ?? 0));
                $repo['rating'] = round((float)($repo['rating'] ?? 0), 2);
                $repo['rating_count'] = (int)($repo['rating_count'] ?? 0);
                // Get verification status from map or default to false
                $repo['publisher_is_verified'] = $verificationMap[$repo['publisher']] ?? false;
            }

            // Re-index array after filtering
            $repositories = array_values($repositories);

            return json_encode([
                "status" => "success",
                "data" => $repositories
            ]);
        } catch (PDOException $e) {
            error_log("General getPublishedRepositories PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Get single repository by ID (public view - only published)
    public function getRepositoryById($repositoryId) {
        try {
            $sql = "SELECT
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
                COALESCE(r.view_count, 0) AS views,
                COALESCE(u.is_verified, 0) AS publisher_is_verified
            FROM tbl_repository r
            INNER JOIN tbl_users u ON r.publisher = u.user_id
            WHERE r.id = :id AND r.publishedStatus = 'published'";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':id' => (int)$repositoryId]);

            $repository = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$repository) {
                return json_encode(["status" => "error", "message" => "Repository not found or not published"]);
            }

            $repository['views'] = (int)($repository['views'] ?? 0);

            // Try to get verification status
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

            // Format category and tags as arrays
            $repository['category'] = !empty($repository['category']) ? explode(', ', $repository['category']) : [];
            $repository['tags'] = !empty($repository['tags']) ? explode(', ', $repository['tags']) : [];

            // Format publishedDate if null
            if (empty($repository['publishedDate'])) {
                $repository['publishedDate'] = date('Y-m-d', strtotime($repository['created_at']));
            }

            return json_encode([
                "status" => "success",
                "data" => $repository
            ]);
        } catch (PDOException $e) {
            error_log("General getRepositoryById PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Get published announcements (public view)
    public function getPublishedAnnouncements() {
        try {
            $sql = "SELECT
                a.id,
                a.title,
                a.content,
                a.published,
                a.created_by,
                a.created_at,
                a.updated_at,
                u.user_name AS created_by_name
            FROM tbl_announcements a
            INNER JOIN tbl_users u ON a.created_by = u.user_id
            WHERE a.published = 1
            ORDER BY a.created_at DESC";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return json_encode([
                "status" => "success",
                "data" => $announcements
            ]);
        } catch (PDOException $e) {
            error_log("General getPublishedAnnouncements PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }
}

// Initialize General class
try {
    $general = new General($pdo);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "System initialization failed"]);
    exit;
}

// Get operation from request
$operation = $_POST['operation'] ?? $_GET['operation'] ?? '';
$jsonData = null;

if (empty($operation)) {
    $jsonData = json_decode(file_get_contents("php://input"), true);
    if (isset($jsonData['operation'])) {
        $operation = $jsonData['operation'];
    }
} else {
    $jsonData = json_decode(file_get_contents("php://input"), true);
}

// Handle API operations using switch case
try {
    switch ($operation) {
        case "get_repositories":
            $filters = [];
            $userId = null;
            if (!empty($jsonData)) {
                $filters = [
                    'categories' => $jsonData['categories'] ?? [],
                    'keywords' => $jsonData['keywords'] ?? '',
                    'yearFrom' => $jsonData['yearFrom'] ?? '',
                    'yearTo' => $jsonData['yearTo'] ?? ''
                ];
                $userId = $jsonData['user_id'] ?? $jsonData['userId'] ?? null;
            } else {
                $filters = [
                    'categories' => $_POST['categories'] ?? $_GET['categories'] ?? [],
                    'keywords' => $_POST['keywords'] ?? $_GET['keywords'] ?? '',
                    'yearFrom' => $_POST['yearFrom'] ?? $_GET['yearFrom'] ?? '',
                    'yearTo' => $_POST['yearTo'] ?? $_GET['yearTo'] ?? ''
                ];
                $userId = $_POST['user_id'] ?? $_POST['userId'] ?? $_GET['user_id'] ?? $_GET['userId'] ?? null;
            }
            echo $general->getPublishedRepositories($filters, $userId);
            break;

        case "get_repository":
            $repositoryId = $_POST['repository_id'] ?? $_GET['repository_id'] ?? ($jsonData['repository_id'] ?? '');
            echo $general->getRepositoryById($repositoryId);
            break;

        case "get_announcements":
            echo $general->getPublishedAnnouncements();
            break;

        default:
            error_log("Invalid operation requested: " . ($operation ?: "empty"));
            echo json_encode(["status" => "error", "message" => "Invalid operation: " . ($operation ?: "none provided")]);
            break;
    }
} catch (Exception $e) {
    error_log("Fatal error in general.php: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Server error occurred: " . $e->getMessage()]);
}
?>
