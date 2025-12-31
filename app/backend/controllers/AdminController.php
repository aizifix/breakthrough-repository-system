<?php

require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../models/RepositoryModel.php';
require_once __DIR__ . '/../models/AnnouncementModel.php';
require_once __DIR__ . '/../models/NotificationModel.php';

class AdminController {
    private $userModel;
    private $repositoryModel;
    private $announcementModel;
    private $notificationModel;
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
        $this->userModel = new UserModel($db);
        $this->repositoryModel = new RepositoryModel($db);
        $this->announcementModel = new AnnouncementModel($db);
        $this->notificationModel = new NotificationModel($db);
    }

    public function getDashboardStats() {
        try {
            $userStmt = $this->conn->prepare("SELECT COUNT(*) as total FROM tbl_users");
            $userStmt->execute();
            $totalUsers = (int)$userStmt->fetch(PDO::FETCH_ASSOC)['total'];

            $repoStats = $this->repositoryModel->getStats();

            $recentStmt = $this->conn->prepare("SELECT r.*, u.user_name AS publisher_name FROM tbl_repository r INNER JOIN tbl_users u ON r.publisher = u.user_id ORDER BY r.created_at DESC LIMIT 5");
            $recentStmt->execute();
            $recentRepositories = $recentStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($recentRepositories as &$repo) {
                $repo['category'] = !empty($repo['category']) ? explode(', ', $repo['category']) : [];
                $repo['tags'] = !empty($repo['tags']) ? explode(', ', $repo['tags']) : [];
            }

            return json_encode([
                "status" => "success",
                "data" => array_merge([
                    "totalUsers" => $totalUsers
                ], $repoStats, [
                    "recentRepositories" => $recentRepositories
                ])
            ]);
        } catch (PDOException $e) {
            error_log("AdminController getDashboardStats Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error"]);
        }
    }

    public function getUsers() {
        $users = $this->userModel->getAll();
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
                'status' => 'active'
            ];
        }
        return json_encode(["status" => "success", "data" => $formattedUsers]);
    }

    public function updateUser($userId, $data) {
        $result = $this->userModel->update($userId, $data);
        if ($result['success']) {
            return json_encode(["status" => "success", "message" => "User updated successfully"]);
        }
        return json_encode(["status" => "error", "message" => $result['message']]);
    }

    public function deleteUser($userId) {
        $result = $this->userModel->delete($userId);
        if ($result['success'] && $result['rowCount'] > 0) {
            return json_encode(["status" => "success", "message" => "User deleted successfully"]);
        }
        return json_encode(["status" => "error", "message" => "User not found"]);
    }

    public function verifyUser($userId, $isVerified) {
        $result = $this->userModel->updateVerification($userId, $isVerified);
        if ($result['success']) {
            return json_encode([
                "status" => "success",
                "message" => $isVerified ? "User verified successfully" : "User verification removed successfully"
            ]);
        }
        return json_encode(["status" => "error", "message" => $result['message']]);
    }

    public function getRepositoriesForModeration() {
        $repositories = $this->repositoryModel->getAllForModeration();
        return json_encode(["status" => "success", "data" => $repositories]);
    }

    public function approveRepository($repositoryId, $publishedDate) {
        $result = $this->repositoryModel->updateStatus($repositoryId, 'published', $publishedDate);
        if ($result['success']) {
            $repo = $this->repositoryModel->getById($repositoryId);
            return json_encode([
                "status" => "success",
                "message" => "Repository approved successfully",
                "data" => $repo
            ]);
        }
        return json_encode(["status" => "error", "message" => $result['message']]);
    }

    public function rejectRepository($repositoryId) {
        $result = $this->repositoryModel->updateStatus($repositoryId, 'rejected');
        if ($result['success']) {
            $repo = $this->repositoryModel->getById($repositoryId);
            return json_encode([
                "status" => "success",
                "message" => "Repository rejected successfully",
                "data" => $repo
            ]);
        }
        return json_encode(["status" => "error", "message" => $result['message']]);
    }

    public function unpublishRepository($repositoryId) {
        $result = $this->repositoryModel->updateStatus($repositoryId, 'unpublished');
        if ($result['success']) {
            $repo = $this->repositoryModel->getById($repositoryId);
            return json_encode([
                "status" => "success",
                "message" => "Repository unpublished successfully",
                "data" => $repo
            ]);
        }
        return json_encode(["status" => "error", "message" => $result['message']]);
    }

    public function getPublishers() {
        $publishers = $this->userModel->getAll('publisher');
        $allRepos = $this->repositoryModel->getPublished();

        foreach ($allRepos as &$repo) {
            $repo['category'] = !empty($repo['category']) ? explode(', ', $repo['category']) : [];
            $repo['tags'] = !empty($repo['tags']) ? explode(', ', $repo['tags']) : [];
        }

        $publishersWithRepos = [];
        foreach ($publishers as $publisher) {
            $publisherRepos = array_filter($allRepos, function($repo) use ($publisher) {
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

        return json_encode(["status" => "success", "data" => $publishersWithRepos]);
    }

    public function getAnnouncements($publishedOnly) {
        $announcements = $this->announcementModel->getAll($publishedOnly);
        return json_encode(["status" => "success", "data" => $announcements]);
    }

    public function createAnnouncement($data) {
        $result = $this->announcementModel->create($data);
        if ($result['success']) {
            if ($data['published']) {
                $this->createAnnouncementNotifications($result['id'], $data['title'], $data['content']);
            }
            $announcement = $this->announcementModel->getById($result['id']);
            return json_encode([
                "status" => "success",
                "message" => "Announcement created successfully",
                "data" => $announcement
            ]);
        }
        return json_encode(["status" => "error", "message" => $result['message']]);
    }

    public function updateAnnouncement($announcementId, $data) {
        $current = $this->announcementModel->getById($announcementId);
        if (!$current) {
            return json_encode(["status" => "error", "message" => "Announcement not found"]);
        }

        $result = $this->announcementModel->update($announcementId, $data);
        if ($result['success']) {
            if (!$current['published'] && $data['published']) {
                $this->createAnnouncementNotifications($announcementId, $data['title'], $data['content']);
            }
            $announcement = $this->announcementModel->getById($announcementId);
            return json_encode([
                "status" => "success",
                "message" => "Announcement updated successfully",
                "data" => $announcement
            ]);
        }
        return json_encode(["status" => "error", "message" => $result['message']]);
    }

    public function deleteAnnouncement($announcementId) {
        $result = $this->announcementModel->delete($announcementId);
        if ($result['success'] && $result['rowCount'] > 0) {
            return json_encode(["status" => "success", "message" => "Announcement deleted successfully"]);
        }
        return json_encode(["status" => "error", "message" => "Announcement not found"]);
    }

    private function createAnnouncementNotifications($announcementId, $title, $content) {
        try {
            $stmt = $this->conn->prepare("SELECT user_id FROM tbl_users");
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $notifications = [];
            $shortContent = strlen($content) > 100 ? substr($content, 0, 100) . '...' : $content;

            foreach ($users as $user) {
                $notifications[] = [
                    'user_id' => $user['user_id'],
                    'title' => $title,
                    'message' => $shortContent,
                    'type' => 'announcement',
                    'related_id' => $announcementId,
                    'related_type' => 'announcement'
                ];
            }

            $this->notificationModel->createBulk($notifications);
        } catch (PDOException $e) {
            error_log("Failed to create announcement notifications: " . $e->getMessage());
        }
    }
}
