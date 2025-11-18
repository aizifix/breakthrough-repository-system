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
            // Get all users with repository count and verification status
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
                u.user_unique_id,
                u.student_id_number,
                u.student_id_image,
                u.created_at,
                COALESCE(u.is_verified, 0) as is_verified,
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
                    'contact' => $user['user_contact'],
                    'address' => $user['user_address'],
                    'uniqueId' => $user['user_unique_id'],
                    'studentIdNumber' => $user['student_id_number'],
                    'studentIdImage' => $user['student_id_image'],
                    'createdAt' => $user['created_at'],
                    'repositoriesCount' => (int)$user['repositories_count'],
                    'isVerified' => (bool)((int)$user['is_verified']),
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

    // Verify or unverify user
    public function verifyUser($userId, $isVerified) {
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

            // Update verification status
            $sql = "UPDATE tbl_users SET is_verified = :is_verified, updated_at = CURRENT_TIMESTAMP WHERE user_id = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                ':id' => (int)$userId,
                ':is_verified' => $isVerified ? 1 : 0
            ]);

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
                "message" => $isVerified ? "User verified successfully" : "User verification removed successfully",
                "data" => [
                    'id' => (string)$updatedUser['user_id'],
                    'name' => $updatedUser['user_name'],
                    'email' => $updatedUser['user_email'],
                    'role' => $updatedUser['user_role'],
                    'institution' => $updatedUser['user_school'],
                    'department' => $updatedUser['user_department'],
                    'position' => $updatedUser['user_type'],
                    'createdAt' => $updatedUser['created_at'],
                    'repositoriesCount' => (int)$updatedUser['repositories_count'],
                    'isVerified' => (bool)((int)$updatedUser['is_verified'])
                ]
            ]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            error_log("Admin verifyUser PDO Error: " . $e->getMessage());
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

    // Get all announcements
    public function getAnnouncements($publishedOnly = false) {
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
            INNER JOIN tbl_users u ON a.created_by = u.user_id";

            if ($publishedOnly) {
                $sql .= " WHERE a.published = 1";
            }

            $sql .= " ORDER BY a.created_at DESC";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
            $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return json_encode([
                "status" => "success",
                "data" => $announcements
            ]);
        } catch (PDOException $e) {
            error_log("Admin getAnnouncements PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Create announcement
    public function createAnnouncement($data) {
        try {
            $this->conn->beginTransaction();

            $sql = "INSERT INTO tbl_announcements (title, content, published, created_by)
                    VALUES (:title, :content, :published, :created_by)";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                ':title' => $data['title'],
                ':content' => $data['content'],
                ':published' => isset($data['published']) ? (int)$data['published'] : 0,
                ':created_by' => (int)$data['created_by']
            ]);

            $announcementId = $this->conn->lastInsertId();

            // If published, create notifications for all users
            if (isset($data['published']) && $data['published']) {
                $this->createAnnouncementNotifications($announcementId, $data['title'], $data['content']);
            }

            $this->conn->commit();

            // Fetch the created announcement
            $stmt = $this->conn->prepare("SELECT
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
            WHERE a.id = :id");
            $stmt->execute([':id' => $announcementId]);
            $announcement = $stmt->fetch(PDO::FETCH_ASSOC);

            return json_encode([
                "status" => "success",
                "message" => "Announcement created successfully",
                "data" => $announcement
            ]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            error_log("Admin createAnnouncement PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Update announcement
    public function updateAnnouncement($announcementId, $data) {
        try {
            $this->conn->beginTransaction();

            // Get current announcement to check if publishing status changed
            $stmt = $this->conn->prepare("SELECT published FROM tbl_announcements WHERE id = :id");
            $stmt->execute([':id' => (int)$announcementId]);
            $current = $stmt->fetch(PDO::FETCH_ASSOC);
            $wasPublished = $current['published'];
            $willBePublished = isset($data['published']) ? (int)$data['published'] : 0;

            $sql = "UPDATE tbl_announcements SET
                    title = :title,
                    content = :content,
                    published = :published,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                ':title' => $data['title'],
                ':content' => $data['content'],
                ':published' => $willBePublished,
                ':id' => (int)$announcementId
            ]);

            // If newly published, create notifications for all users
            if (!$wasPublished && $willBePublished) {
                $this->createAnnouncementNotifications($announcementId, $data['title'], $data['content']);
            }

            $this->conn->commit();

            // Fetch the updated announcement
            $stmt = $this->conn->prepare("SELECT
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
            WHERE a.id = :id");
            $stmt->execute([':id' => (int)$announcementId]);
            $announcement = $stmt->fetch(PDO::FETCH_ASSOC);

            return json_encode([
                "status" => "success",
                "message" => "Announcement updated successfully",
                "data" => $announcement
            ]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            error_log("Admin updateAnnouncement PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Delete announcement
    public function deleteAnnouncement($announcementId) {
        try {
            $stmt = $this->conn->prepare("DELETE FROM tbl_announcements WHERE id = :id");
            $stmt->execute([':id' => (int)$announcementId]);

            if ($stmt->rowCount() > 0) {
                return json_encode([
                    "status" => "success",
                    "message" => "Announcement deleted successfully"
                ]);
            } else {
                return json_encode([
                    "status" => "error",
                    "message" => "Announcement not found"
                ]);
            }
        } catch (PDOException $e) {
            error_log("Admin deleteAnnouncement PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Helper function to create notifications for all users when announcement is published
    private function createAnnouncementNotifications($announcementId, $title, $content) {
        try {
            // Get all users except admins (or include them if you want)
            $stmt = $this->conn->prepare("SELECT user_id FROM tbl_users");
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $notificationSql = "INSERT INTO tbl_notifications (user_id, title, message, type, related_id, related_type)
                                VALUES (:user_id, :title, :message, 'announcement', :related_id, 'announcement')";
            $notificationStmt = $this->conn->prepare($notificationSql);

            $shortContent = strlen($content) > 100 ? substr($content, 0, 100) . '...' : $content;

            foreach ($users as $user) {
                $notificationStmt->execute([
                    ':user_id' => (int)$user['user_id'],
                    ':title' => $title,
                    ':message' => $shortContent,
                    ':related_id' => (int)$announcementId
                ]);
            }
        } catch (PDOException $e) {
            error_log("Admin createAnnouncementNotifications PDO Error: " . $e->getMessage());
            // Don't throw, just log - we don't want to fail the announcement creation
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

        case "verify_user":
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? '');
            $isVerified = isset($_POST['is_verified']) ? (bool)$_POST['is_verified'] : (isset($jsonData['is_verified']) ? (bool)$jsonData['is_verified'] : true);
            if (empty($userId)) {
                echo json_encode(["status" => "error", "message" => "User ID is required"]);
                break;
            }
            echo $admin->verifyUser($userId, $isVerified);
            break;

        case "get_announcements":
            $publishedOnly = isset($_POST['published_only']) ? (bool)$_POST['published_only'] : (isset($jsonData['published_only']) ? (bool)$jsonData['published_only'] : false);
            echo $admin->getAnnouncements($publishedOnly);
            break;

        case "create_announcement":
            $data = !empty($jsonData) ? $jsonData : $_POST;
            unset($data['operation']);
            echo $admin->createAnnouncement($data);
            break;

        case "update_announcement":
            $announcementId = $_POST['announcement_id'] ?? ($jsonData['announcement_id'] ?? '');
            $data = !empty($jsonData) ? $jsonData : $_POST;
            unset($data['operation'], $data['announcement_id']);
            echo $admin->updateAnnouncement($announcementId, $data);
            break;

        case "delete_announcement":
            $announcementId = $_POST['announcement_id'] ?? ($jsonData['announcement_id'] ?? '');
            echo $admin->deleteAnnouncement($announcementId);
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
