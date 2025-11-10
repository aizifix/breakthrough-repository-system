<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Set timezone
date_default_timezone_set('Asia/Manila');

require_once 'db_connect.php';

// Admin class with function-based OOP structure
class Admin {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Get repositories for moderation
    public function getRepositoriesForModeration() {
        try {
            // Get all repositories with publisher info, ordered by created_at DESC
            $sql = "SELECT
                r.*,
                u.user_name AS publisher_name,
                u.user_email AS publisher_email,
                u.user_school AS publisher_school,
                u.user_department AS publisher_department
            FROM tbl_repository r
            INNER JOIN tbl_users u ON r.publisher = u.user_id
            ORDER BY r.created_at DESC";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute();

            $repositories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format category and tags as arrays
            foreach ($repositories as &$repo) {
                $repo['category'] = !empty($repo['category']) ? explode(', ', $repo['category']) : [];
                $repo['tags'] = !empty($repo['tags']) ? explode(', ', $repo['tags']) : [];
            }

            return json_encode([
                "status" => "success",
                "data" => $repositories
            ]);
        } catch (PDOException $e) {
            error_log("Admin getRepositoriesForModeration PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Approve repository
    public function approveRepository($repositoryId, $moderationNote = null, $publishedDate = null) {
        try {
            $this->conn->beginTransaction();

            // Check if repository exists
            $stmt = $this->conn->prepare("SELECT * FROM tbl_repository WHERE id = :id");
            $stmt->execute([':id' => (int)$repositoryId]);
            $repository = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$repository) {
                $this->conn->rollBack();
                return json_encode(["status" => "error", "message" => "Repository not found"]);
            }

            // Use provided date or current date
            $dateToUse = $publishedDate ? $publishedDate : date('Y-m-d');

            // Update repository status to published
            $sql = "UPDATE tbl_repository SET
                publishedStatus = 'published',
                publishedDate = :publishedDate,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                ':id' => (int)$repositoryId,
                ':publishedDate' => $dateToUse
            ]);

            $this->conn->commit();

            // Fetch the updated repository
            $stmt = $this->conn->prepare("
                SELECT
                    r.*,
                    u.user_name AS publisher_name,
                    u.user_email AS publisher_email,
                    u.user_school AS publisher_school,
                    u.user_department AS publisher_department
                FROM tbl_repository r
                INNER JOIN tbl_users u ON r.publisher = u.user_id
                WHERE r.id = :id
            ");
            $stmt->execute([':id' => (int)$repositoryId]);
            $updatedRepository = $stmt->fetch(PDO::FETCH_ASSOC);

            // Format category and tags as arrays
            $updatedRepository['category'] = !empty($updatedRepository['category']) ? explode(', ', $updatedRepository['category']) : [];
            $updatedRepository['tags'] = !empty($updatedRepository['tags']) ? explode(', ', $updatedRepository['tags']) : [];

            return json_encode([
                "status" => "success",
                "message" => "Repository approved successfully",
                "data" => $updatedRepository
            ]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            error_log("Admin approveRepository PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Unpublish repository
    public function unpublishRepository($repositoryId) {
        try {
            $this->conn->beginTransaction();

            // Check if repository exists
            $stmt = $this->conn->prepare("SELECT * FROM tbl_repository WHERE id = :id");
            $stmt->execute([':id' => (int)$repositoryId]);
            $repository = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$repository) {
                $this->conn->rollBack();
                return json_encode(["status" => "error", "message" => "Repository not found"]);
            }

            // Update repository status to unpublished
            $sql = "UPDATE tbl_repository SET
                publishedStatus = 'unpublished',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':id' => (int)$repositoryId]);

            $this->conn->commit();

            // Fetch the updated repository
            $stmt = $this->conn->prepare("
                SELECT
                    r.*,
                    u.user_name AS publisher_name,
                    u.user_email AS publisher_email,
                    u.user_school AS publisher_school,
                    u.user_department AS publisher_department
                FROM tbl_repository r
                INNER JOIN tbl_users u ON r.publisher = u.user_id
                WHERE r.id = :id
            ");
            $stmt->execute([':id' => (int)$repositoryId]);
            $updatedRepository = $stmt->fetch(PDO::FETCH_ASSOC);

            // Format category and tags as arrays
            $updatedRepository['category'] = !empty($updatedRepository['category']) ? explode(', ', $updatedRepository['category']) : [];
            $updatedRepository['tags'] = !empty($updatedRepository['tags']) ? explode(', ', $updatedRepository['tags']) : [];

            return json_encode([
                "status" => "success",
                "message" => "Repository unpublished successfully",
                "data" => $updatedRepository
            ]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            error_log("Admin unpublishRepository PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Reject repository
    public function rejectRepository($repositoryId, $reason = null) {
        try {
            $this->conn->beginTransaction();

            // Check if repository exists
            $stmt = $this->conn->prepare("SELECT * FROM tbl_repository WHERE id = :id");
            $stmt->execute([':id' => (int)$repositoryId]);
            $repository = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$repository) {
                $this->conn->rollBack();
                return json_encode(["status" => "error", "message" => "Repository not found"]);
            }

            // Update repository status to rejected
            $sql = "UPDATE tbl_repository SET
                publishedStatus = 'rejected',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':id' => (int)$repositoryId]);

            $this->conn->commit();

            // Fetch the updated repository
            $stmt = $this->conn->prepare("
                SELECT
                    r.*,
                    u.user_name AS publisher_name,
                    u.user_email AS publisher_email,
                    u.user_school AS publisher_school,
                    u.user_department AS publisher_department
                FROM tbl_repository r
                INNER JOIN tbl_users u ON r.publisher = u.user_id
                WHERE r.id = :id
            ");
            $stmt->execute([':id' => (int)$repositoryId]);
            $updatedRepository = $stmt->fetch(PDO::FETCH_ASSOC);

            // Format category and tags as arrays
            $updatedRepository['category'] = !empty($updatedRepository['category']) ? explode(', ', $updatedRepository['category']) : [];
            $updatedRepository['tags'] = !empty($updatedRepository['tags']) ? explode(', ', $updatedRepository['tags']) : [];

            return json_encode([
                "status" => "success",
                "message" => "Repository rejected successfully",
                "data" => $updatedRepository,
                "reason" => $reason
            ]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            error_log("Admin rejectRepository PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Get all users
    public function getUsers() {
        try {
            // Get all users with repository count
            $sql = "SELECT
                u.user_id,
                u.user_name,
                u.user_email,
                u.user_role,
                u.user_school,
                u.user_department,
                u.user_type,
                u.user_contact,
                u.user_address,
                u.created_at,
                COUNT(r.id) as repositories_count
            FROM tbl_users u
            LEFT JOIN tbl_repository r ON u.user_id = r.publisher
            GROUP BY u.user_id
            ORDER BY u.created_at DESC";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format users
            $formattedUsers = [];
            foreach ($users as $user) {
                $formattedUsers[] = [
                    'id' => (string)$user['user_id'],
                    'name' => $user['user_name'],
                    'email' => $user['user_email'],
                    'role' => $user['user_role'],
                    'institution' => $user['user_school'],
                    'department' => $user['user_department'],
                    'position' => $user['user_type'],
                    'createdAt' => $user['created_at'],
                    'repositoriesCount' => (int)$user['repositories_count'],
                    'status' => 'active' // Default status, you can add status field to database if needed
                ];
            }

            return json_encode([
                "status" => "success",
                "data" => $formattedUsers
            ]);
        } catch (PDOException $e) {
            error_log("Admin getUsers PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Update user
    public function updateUser($userId, $data) {
        try {
            $this->conn->beginTransaction();

            // Check if user exists
            $stmt = $this->conn->prepare("SELECT * FROM tbl_users WHERE user_id = :id");
            $stmt->execute([':id' => (int)$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                $this->conn->rollBack();
                return json_encode(["status" => "error", "message" => "User not found"]);
            }

            // Build update query
            $updateFields = [];
            $params = [':id' => (int)$userId];

            if (isset($data['user_name'])) {
                $updateFields[] = "user_name = :user_name";
                $params[':user_name'] = $data['user_name'];
            }
            if (isset($data['user_email'])) {
                $updateFields[] = "user_email = :user_email";
                $params[':user_email'] = $data['user_email'];
            }
            if (isset($data['user_role'])) {
                $updateFields[] = "user_role = :user_role";
                $params[':user_role'] = $data['user_role'];
            }
            if (isset($data['user_school'])) {
                $updateFields[] = "user_school = :user_school";
                $params[':user_school'] = $data['user_school'] ?: null;
            }
            if (isset($data['user_department'])) {
                $updateFields[] = "user_department = :user_department";
                $params[':user_department'] = $data['user_department'] ?: null;
            }
            if (isset($data['user_type'])) {
                $updateFields[] = "user_type = :user_type";
                $params[':user_type'] = $data['user_type'] ?: null;
            }

            if (empty($updateFields)) {
                $this->conn->rollBack();
                return json_encode(["status" => "error", "message" => "No fields to update"]);
            }

            $updateFields[] = "updated_at = CURRENT_TIMESTAMP";
            $sql = "UPDATE tbl_users SET " . implode(", ", $updateFields) . " WHERE user_id = :id";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);

            $this->conn->commit();

            // Fetch updated user
            $stmt = $this->conn->prepare("
                SELECT
                    u.*,
                    COUNT(r.id) as repositories_count
                FROM tbl_users u
                LEFT JOIN tbl_repository r ON u.user_id = r.publisher
                WHERE u.user_id = :id
                GROUP BY u.user_id
            ");
            $stmt->execute([':id' => (int)$userId]);
            $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);

            return json_encode([
                "status" => "success",
                "message" => "User updated successfully",
                "data" => $updatedUser
            ]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            error_log("Admin updateUser PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Delete user
    public function deleteUser($userId) {
        try {
            $this->conn->beginTransaction();

            // Check if user exists
            $stmt = $this->conn->prepare("SELECT * FROM tbl_users WHERE user_id = :id");
            $stmt->execute([':id' => (int)$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                $this->conn->rollBack();
                return json_encode(["status" => "error", "message" => "User not found"]);
            }

            // Check if user has repositories (foreign key constraint will handle this, but we can check first)
            $stmt = $this->conn->prepare("SELECT COUNT(*) as count FROM tbl_repository WHERE publisher = :id");
            $stmt->execute([':id' => (int)$userId]);
            $repoCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            if ($repoCount > 0) {
                $this->conn->rollBack();
                return json_encode([
                    "status" => "error",
                    "message" => "Cannot delete user with existing repositories. Please delete or reassign repositories first."
                ]);
            }

            // Delete user
            $stmt = $this->conn->prepare("DELETE FROM tbl_users WHERE user_id = :id");
            $stmt->execute([':id' => (int)$userId]);

            $this->conn->commit();

            return json_encode([
                "status" => "success",
                "message" => "User deleted successfully"
            ]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            error_log("Admin deleteUser PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Get all publishers with their repositories
    public function getPublishers() {
        try {
            // Get all users with role 'publisher'
            $sql = "SELECT
                u.user_id,
                u.user_name,
                u.user_email,
                u.user_school,
                u.user_department,
                u.user_type,
                u.user_contact,
                u.user_address,
                u.created_at
            FROM tbl_users u
            WHERE u.user_role = 'publisher'
            ORDER BY u.created_at DESC";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $publishers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get all repositories
            $repoSql = "SELECT
                r.*,
                u.user_name AS publisher_name,
                u.user_email AS publisher_email
            FROM tbl_repository r
            INNER JOIN tbl_users u ON r.publisher = u.user_id
            ORDER BY r.created_at DESC";

            $repoStmt = $this->conn->prepare($repoSql);
            $repoStmt->execute();
            $allRepositories = $repoStmt->fetchAll(PDO::FETCH_ASSOC);

            // Format repositories and group by publisher
            foreach ($allRepositories as &$repo) {
                $repo['category'] = !empty($repo['category']) ? explode(', ', $repo['category']) : [];
                $repo['tags'] = !empty($repo['tags']) ? explode(', ', $repo['tags']) : [];
            }

            // Group repositories by publisher
            $publishersWithRepos = [];
            foreach ($publishers as $publisher) {
                $publisherRepos = array_filter($allRepositories, function($repo) use ($publisher) {
                    return $repo['publisher'] == $publisher['user_id'];
                });

                $publishersWithRepos[] = [
                    'id' => (string)$publisher['user_id'],
                    'name' => $publisher['user_name'],
                    'email' => $publisher['user_email'],
                    'avatar' => strtoupper(substr(str_replace(' ', '', $publisher['user_name']), 0, 2)),
                    'institution' => $publisher['user_school'],
                    'department' => $publisher['user_department'],
                    'createdAt' => $publisher['created_at'],
                    'repositories' => array_values($publisherRepos)
                ];
            }

            return json_encode([
                "status" => "success",
                "data" => $publishersWithRepos
            ]);
        } catch (PDOException $e) {
            error_log("Admin getPublishers PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Get dashboard statistics
    public function getDashboardStats() {
        try {
            // Total users
            $stmt = $this->conn->prepare("SELECT COUNT(*) as total FROM tbl_users");
            $stmt->execute();
            $totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Total repositories
            $stmt = $this->conn->prepare("SELECT COUNT(*) as total FROM tbl_repository");
            $stmt->execute();
            $totalRepositories = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Pending moderation
            $stmt = $this->conn->prepare("SELECT COUNT(*) as total FROM tbl_repository WHERE publishedStatus = 'pending'");
            $stmt->execute();
            $pendingModeration = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Published today
            $stmt = $this->conn->prepare("SELECT COUNT(*) as total FROM tbl_repository WHERE publishedStatus = 'published' AND DATE(publishedDate) = CURDATE()");
            $stmt->execute();
            $publishedToday = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Published this week
            $stmt = $this->conn->prepare("SELECT COUNT(*) as total FROM tbl_repository WHERE publishedStatus = 'published' AND publishedDate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)");
            $stmt->execute();
            $publishedThisWeek = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Rejected this week
            $stmt = $this->conn->prepare("SELECT COUNT(*) as total FROM tbl_repository WHERE publishedStatus = 'rejected' AND updated_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)");
            $stmt->execute();
            $rejectedThisWeek = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Total published
            $stmt = $this->conn->prepare("SELECT COUNT(*) as total FROM tbl_repository WHERE publishedStatus = 'published'");
            $stmt->execute();
            $totalPublished = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Recent repositories (last 5)
            $stmt = $this->conn->prepare("
                SELECT
                    r.*,
                    u.user_name AS publisher_name
                FROM tbl_repository r
                INNER JOIN tbl_users u ON r.publisher = u.user_id
                ORDER BY r.created_at DESC
                LIMIT 5
            ");
            $stmt->execute();
            $recentRepositories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Format recent repositories
            foreach ($recentRepositories as &$repo) {
                $repo['category'] = !empty($repo['category']) ? explode(', ', $repo['category']) : [];
                $repo['tags'] = !empty($repo['tags']) ? explode(', ', $repo['tags']) : [];
            }

            return json_encode([
                "status" => "success",
                "data" => [
                    "totalUsers" => (int)$totalUsers,
                    "totalRepositories" => (int)$totalRepositories,
                    "pendingModeration" => (int)$pendingModeration,
                    "publishedToday" => (int)$publishedToday,
                    "publishedThisWeek" => (int)$publishedThisWeek,
                    "rejectedThisWeek" => (int)$rejectedThisWeek,
                    "totalPublished" => (int)$totalPublished,
                    "recentRepositories" => $recentRepositories
                ]
            ]);
        } catch (PDOException $e) {
            error_log("Admin getDashboardStats PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }
}

// Initialize Admin class
try {
    $admin = new Admin($pdo);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "System initialization failed"]);
    exit;
}

// Get operation from request
$operation = $_POST['operation'] ?? '';
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
        case "get_repositories_moderation":
            echo $admin->getRepositoriesForModeration();
            break;

        case "approve_repository":
            $repositoryId = $_POST['repository_id'] ?? ($jsonData['repository_id'] ?? '');
            $moderationNote = $_POST['moderation_note'] ?? ($jsonData['moderation_note'] ?? null);
            $publishedDate = $_POST['published_date'] ?? ($jsonData['published_date'] ?? null);
            echo $admin->approveRepository($repositoryId, $moderationNote, $publishedDate);
            break;

        case "reject_repository":
            $repositoryId = $_POST['repository_id'] ?? ($jsonData['repository_id'] ?? '');
            $reason = $_POST['reason'] ?? ($jsonData['reason'] ?? null);
            echo $admin->rejectRepository($repositoryId, $reason);
            break;

        case "unpublish_repository":
            $repositoryId = $_POST['repository_id'] ?? ($jsonData['repository_id'] ?? '');
            echo $admin->unpublishRepository($repositoryId);
            break;

        case "get_dashboard_stats":
            echo $admin->getDashboardStats();
            break;

        case "get_publishers":
            echo $admin->getPublishers();
            break;

        case "get_users":
            echo $admin->getUsers();
            break;

        case "update_user":
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? '');
            $data = !empty($jsonData) ? $jsonData : $_POST;
            unset($data['operation'], $data['user_id']);
            echo $admin->updateUser($userId, $data);
            break;

        case "delete_user":
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? '');
            echo $admin->deleteUser($userId);
            break;

        default:
            error_log("Invalid operation requested: " . ($operation ?: "empty"));
            echo json_encode(["status" => "error", "message" => "Invalid operation: " . ($operation ?: "none provided")]);
            break;
    }
} catch (Exception $e) {
    error_log("Fatal error in admin.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    echo json_encode(["status" => "error", "message" => "Server error occurred: " . $e->getMessage()]);
}
?>
