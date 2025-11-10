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
    public function getPublishedRepositories($filters = []) {
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
                r.created_at
            FROM tbl_repository r
            INNER JOIN tbl_users u ON r.publisher = u.user_id
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

            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);

            $repositories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format category and tags as arrays
            foreach ($repositories as &$repo) {
                $repo['category'] = !empty($repo['category']) ? explode(', ', $repo['category']) : [];
                $repo['tags'] = !empty($repo['tags']) ? explode(', ', $repo['tags']) : [];

                // Format publishedDate if null
                if (empty($repo['publishedDate'])) {
                    $repo['publishedDate'] = date('Y-m-d', strtotime($repo['created_at']));
                }
            }

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
                r.created_at
            FROM tbl_repository r
            INNER JOIN tbl_users u ON r.publisher = u.user_id
            WHERE r.id = :id AND r.publishedStatus = 'published'";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':id' => (int)$repositoryId]);

            $repository = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$repository) {
                return json_encode(["status" => "error", "message" => "Repository not found or not published"]);
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
            if (!empty($jsonData)) {
                $filters = [
                    'categories' => $jsonData['categories'] ?? [],
                    'keywords' => $jsonData['keywords'] ?? '',
                    'yearFrom' => $jsonData['yearFrom'] ?? '',
                    'yearTo' => $jsonData['yearTo'] ?? ''
                ];
            } else {
                $filters = [
                    'categories' => $_POST['categories'] ?? $_GET['categories'] ?? [],
                    'keywords' => $_POST['keywords'] ?? $_GET['keywords'] ?? '',
                    'yearFrom' => $_POST['yearFrom'] ?? $_GET['yearFrom'] ?? '',
                    'yearTo' => $_POST['yearTo'] ?? $_GET['yearTo'] ?? ''
                ];
            }
            echo $general->getPublishedRepositories($filters);
            break;

        case "get_repository":
            $repositoryId = $_POST['repository_id'] ?? $_GET['repository_id'] ?? ($jsonData['repository_id'] ?? '');
            echo $general->getRepositoryById($repositoryId);
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
