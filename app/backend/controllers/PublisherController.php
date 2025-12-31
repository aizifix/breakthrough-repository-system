<?php

require_once __DIR__ . '/../models/RepositoryModel.php';

class PublisherController {
    private $repositoryModel;
    private $conn;
    private $uploadDir;

    public function __construct($db) {
        $this->conn = $db;
        $this->repositoryModel = new RepositoryModel($db);
        $this->setupUploadDir();
    }

    private function setupUploadDir() {
        $baseDir = __DIR__ . '/..';
        $this->uploadDir = realpath($baseDir) . '/uploads/repository/';
        if (!file_exists($this->uploadDir)) {
            mkdir($this->uploadDir, 0777, true);
        }
    }

    public function getRepositories($userId, $currentUserId) {
        error_log("PublisherController::getRepositories called with userId=" . var_export($userId, true) . ", currentUserId=" . var_export($currentUserId, true));
        $repositories = $this->repositoryModel->getByPublisher($userId);
        error_log("PublisherController::getRepositories returning " . count($repositories) . " repositories");
        return json_encode(["status" => "success", "data" => $repositories]);
    }

    public function getRepositoryById($repositoryId) {
        $repository = $this->repositoryModel->getById($repositoryId);
        if ($repository) {
            return json_encode(["status" => "success", "data" => $repository]);
        }
        return json_encode(["status" => "error", "message" => "Repository not found"]);
    }

    public function createRepository($data, $pdfFile) {
        if (empty($data['title']) || empty($data['abstract']) || empty($data['publisher'])) {
            return json_encode(["status" => "error", "message" => "Title, abstract, and publisher are required"]);
        }

        if (!$pdfFile || $pdfFile['error'] !== UPLOAD_ERR_OK) {
            return json_encode(["status" => "error", "message" => "PDF file is required"]);
        }

        $pdfUrl = $this->handleFileUpload($pdfFile);
        if (!$pdfUrl) {
            return json_encode(["status" => "error", "message" => "Failed to upload PDF file"]);
        }

        $data['pdfUrl'] = $pdfUrl;
        $result = $this->repositoryModel->create($data);

        if ($result['success']) {
            $repo = $this->repositoryModel->getById($result['id']);
            return json_encode([
                "status" => "success",
                "message" => "Repository created successfully. Waiting for admin approval.",
                "data" => $repo
            ]);
        }

        if (file_exists($this->uploadDir . basename($pdfUrl))) {
            unlink($this->uploadDir . basename($pdfUrl));
        }

        return json_encode(["status" => "error", "message" => $result['message']]);
    }

    public function updateRepository($repositoryId, $data, $pdfFile = null) {
        $existing = $this->repositoryModel->getById($repositoryId);
        if (!$existing) {
            return json_encode(["status" => "error", "message" => "Repository not found"]);
        }

        if (!in_array($existing['publishedStatus'], ['pending', 'unpublished'])) {
            return json_encode(["status" => "error", "message" => "Cannot update published repository"]);
        }

        if ($pdfFile && $pdfFile['error'] === UPLOAD_ERR_OK) {
            if ($existing['pdfUrl']) {
                $oldFile = $this->uploadDir . basename($existing['pdfUrl']);
                if (file_exists($oldFile)) {
                    unlink($oldFile);
                }
            }

            $pdfUrl = $this->handleFileUpload($pdfFile);
            if (!$pdfUrl) {
                return json_encode(["status" => "error", "message" => "Failed to upload PDF file"]);
            }
            $data['pdfUrl'] = $pdfUrl;
        }

        try {
            $sql = "UPDATE tbl_repository SET title = :title, abstract = :abstract, category = :category, tags = :tags, updated_at = CURRENT_TIMESTAMP";
            $params = [
                ':title' => trim($data['title']),
                ':abstract' => trim($data['abstract']),
                ':category' => $data['category'] ?? '',
                ':tags' => is_array($data['tags']) ? implode(', ', $data['tags']) : ($data['tags'] ?? ''),
                ':id' => (int)$repositoryId
            ];

            if (isset($data['pdfUrl'])) {
                $sql .= ", pdfUrl = :pdfUrl";
                $params[':pdfUrl'] = $data['pdfUrl'];
            }

            $sql .= " WHERE id = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);

            return json_encode(["status" => "success", "message" => "Repository updated successfully"]);
        } catch (PDOException $e) {
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function deleteRepository($repositoryId, $userId) {
        $existing = $this->repositoryModel->getById($repositoryId);
        if (!$existing || $existing['publisher'] != $userId) {
            return json_encode(["status" => "error", "message" => "Repository not found or access denied"]);
        }

        if (!in_array($existing['publishedStatus'], ['pending', 'unpublished'])) {
            return json_encode(["status" => "error", "message" => "Cannot delete published repository"]);
        }

        if ($existing['pdfUrl']) {
            $filePath = $this->uploadDir . basename($existing['pdfUrl']);
            if (file_exists($filePath)) {
                unlink($filePath);
            }
        }

        try {
            $stmt = $this->conn->prepare("DELETE FROM tbl_repository WHERE id = :id");
            $stmt->execute([':id' => (int)$repositoryId]);
            return json_encode(["status" => "success", "message" => "Repository deleted successfully"]);
        } catch (PDOException $e) {
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function incrementViewCount($repositoryId) {
        $result = $this->repositoryModel->incrementViewCount($repositoryId);
        return json_encode($result);
    }

    public function rateRepository($repositoryId, $userId, $rating) {
        $rating = (int)$rating;
        if ($rating < 1 || $rating > 5) {
            return json_encode(["status" => "error", "message" => "Rating must be between 1 and 5"]);
        }

        try {
            $checkStmt = $this->conn->prepare("SELECT id FROM tbl_repository_ratings WHERE repository_id = ? AND user_id = ?");
            $checkStmt->execute([$repositoryId, $userId]);
            $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                $stmt = $this->conn->prepare("UPDATE tbl_repository_ratings SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
                $stmt->execute([$rating, $existing['id']]);
            } else {
                $stmt = $this->conn->prepare("INSERT INTO tbl_repository_ratings (repository_id, user_id, rating) VALUES (?, ?, ?)");
                $stmt->execute([$repositoryId, $userId, $rating]);
            }

            $statsStmt = $this->conn->prepare("SELECT AVG(rating) as average_rating, COUNT(*) as total_ratings FROM tbl_repository_ratings WHERE repository_id = ?");
            $statsStmt->execute([$repositoryId]);
            $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

            $userStmt = $this->conn->prepare("SELECT rating FROM tbl_repository_ratings WHERE repository_id = ? AND user_id = ?");
            $userStmt->execute([$repositoryId, $userId]);
            $userRating = $userStmt->fetch(PDO::FETCH_ASSOC);

            return json_encode([
                "status" => "success",
                "data" => [
                    "userRating" => (int)($userRating['rating'] ?? 0),
                    "averageRating" => round((float)$stats['average_rating'], 2),
                    "totalRatings" => (int)$stats['total_ratings']
                ]
            ]);
        } catch (PDOException $e) {
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function toggleLike($repositoryId, $userId) {
        try {
            $checkStmt = $this->conn->prepare("SELECT id FROM tbl_repository_likes WHERE repository_id = ? AND user_id = ?");
            $checkStmt->execute([$repositoryId, $userId]);
            $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                $stmt = $this->conn->prepare("DELETE FROM tbl_repository_likes WHERE id = ?");
                $stmt->execute([$existing['id']]);
                $isLiked = false;
            } else {
                $stmt = $this->conn->prepare("INSERT INTO tbl_repository_likes (repository_id, user_id) VALUES (?, ?)");
                $stmt->execute([$repositoryId, $userId]);
                $isLiked = true;
            }

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
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function addComment($repositoryId, $userId, $comment, $parentCommentId = null) {
        if (empty(trim($comment))) {
            return json_encode(["status" => "error", "message" => "Comment cannot be empty"]);
        }

        try {
            $stmt = $this->conn->prepare("INSERT INTO tbl_repository_comments (repository_id, user_id, comment, parent_comment_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$repositoryId, $userId, trim($comment), $parentCommentId]);

            $commentId = $this->conn->lastInsertId();

            $getStmt = $this->conn->prepare("SELECT c.id, c.comment, c.parent_comment_id, c.created_at, c.updated_at, u.user_id, u.user_name, u.user_email FROM tbl_repository_comments c INNER JOIN tbl_users u ON c.user_id = u.user_id WHERE c.id = ?");
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
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function getComments($repositoryId, $limit = 50, $offset = 0) {
        try {
            $stmt = $this->conn->prepare("SELECT c.id, c.comment, c.parent_comment_id, c.created_at, c.updated_at, u.user_id, u.user_name, u.user_email FROM tbl_repository_comments c INNER JOIN tbl_users u ON c.user_id = u.user_id WHERE c.repository_id = ? AND c.is_deleted = 0 ORDER BY c.created_at DESC LIMIT ? OFFSET ?");
            $stmt->execute([$repositoryId, $limit, $offset]);
            $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function deleteComment($commentId, $userId) {
        try {
            $checkStmt = $this->conn->prepare("SELECT user_id FROM tbl_repository_comments WHERE id = ? AND is_deleted = 0");
            $checkStmt->execute([$commentId]);
            $comment = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$comment) {
                return json_encode(["status" => "error", "message" => "Comment not found"]);
            }

            if ((int)$comment['user_id'] !== (int)$userId) {
                return json_encode(["status" => "error", "message" => "You can only delete your own comments"]);
            }

            $stmt = $this->conn->prepare("UPDATE tbl_repository_comments SET is_deleted = 1 WHERE id = ?");
            $stmt->execute([$commentId]);

            return json_encode(["status" => "success", "message" => "Comment deleted successfully"]);
        } catch (PDOException $e) {
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    public function getSavedRepositories($userId) {
        try {
            // First, get the saved repository IDs for this user
            $stmt = $this->conn->prepare("
                SELECT r.id
                FROM tbl_repository_likes rl
                INNER JOIN tbl_repository r ON rl.repository_id = r.id
                WHERE rl.user_id = :user_id AND r.publishedStatus = 'published'
                ORDER BY rl.created_at DESC
            ");
            $stmt->execute([':user_id' => (int)$userId]);
            $savedRepoIds = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

            if (empty($savedRepoIds)) {
                return json_encode(["status" => "success", "data" => []]);
            }

            // Now get the full repository details for these IDs
            $placeholders = str_repeat('?,', count($savedRepoIds) - 1) . '?';
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
            WHERE r.id IN ($placeholders) AND r.publishedStatus = 'published'
            ORDER BY r.publishedDate DESC, r.created_at DESC";

            $stmt = $this->conn->prepare($sql);
            $params = array_merge($savedRepoIds, [(int)$userId]);
            $stmt->execute($params);
            $repositories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $userModel = new UserModel($this->conn);
            $verificationMap = $userModel->getVerificationMap();

            foreach ($repositories as &$repo) {
                $repo['category'] = $this->formatCategories($repo['category']);
                $repo['tags'] = $this->formatTags($repo['tags']);
                $repo['publishedDate'] = $this->formatDate($repo['publishedDate'], $repo['created_at']);
                $repo['views'] = (int)($repo['views'] ?? 0);
                $repo['likes'] = (int)($repo['likes'] ?? 0);
                $repo['isLiked'] = (bool)((int)($repo['is_liked'] ?? 0));
                $repo['publisher_is_verified'] = $verificationMap[$repo['publisher']] ?? false;
            }

            return json_encode(["status" => "success", "data" => $repositories]);
        } catch (PDOException $e) {
            error_log("PublisherController getSavedRepositories Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error occurred"]);
        }
    }

    private function handleFileUpload($file) {
        $fileType = mime_content_type($file['tmp_name']);
        if ($fileType !== 'application/pdf') {
            return false;
        }

        $originalName = $file['name'];
        $fileName = str_replace(['../', '..\\', "\0"], '', $originalName);
        $fileName = basename($fileName);

        if (pathinfo($fileName, PATHINFO_EXTENSION) !== 'pdf') {
            $fileName = pathinfo($fileName, PATHINFO_FILENAME) . '.pdf';
        }

        if (empty($fileName) || $fileName === '.pdf') {
            $fileName = 'document_' . time() . '.pdf';
        }

        $filePath = $this->uploadDir . $fileName;
        $counter = 1;
        $baseFileName = pathinfo($fileName, PATHINFO_FILENAME);
        $ext = pathinfo($fileName, PATHINFO_EXTENSION);

        while (file_exists($filePath)) {
            $fileName = $baseFileName . '_' . $counter . '.' . $ext;
            $filePath = $this->uploadDir . $fileName;
            $counter++;
        }

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            return false;
        }

        return '/uploads/repository/' . $fileName;
    }
}
