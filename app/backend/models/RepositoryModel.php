<?php

require_once __DIR__ . '/BaseModel.php';
require_once __DIR__ . '/UserModel.php';

class RepositoryModel extends BaseModel {
    public function getAllForModeration() {
        try {
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

            foreach ($repositories as &$repo) {
                $repo['category'] = $this->formatCategories($repo['category']);
                $repo['tags'] = $this->formatTags($repo['tags']);
            }

            return $repositories;
        } catch (PDOException $e) {
            error_log("RepositoryModel getAllForModeration Error: " . $e->getMessage());
            return [];
        }
    }

    public function getPublished($filters = [], $userId = null) {
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
                WHERE user_id = :user_id
            ) user_likes ON r.id = user_likes.repository_id
            WHERE r.publishedStatus = 'published'";

            $params = [];
            if ($userId) {
                $params[':user_id'] = (int)$userId;
            } else {
                $params[':user_id'] = 0;
            }

            if (!empty($filters['categories']) && is_array($filters['categories'])) {
                $categoryPlaceholders = [];
                foreach ($filters['categories'] as $index => $category) {
                    $placeholder = ':category' . $index;
                    $categoryPlaceholders[] = $placeholder;
                    $params[$placeholder] = '%' . $category . '%';
                }
                if (!empty($categoryPlaceholders)) {
                    $sql .= " AND (" . implode(" OR ", array_map(function($p) {
                        return "r.category LIKE " . $p;
                    }, $categoryPlaceholders)) . ")";
                }
            }

            if (!empty($filters['keywords'])) {
                $sql .= " AND (r.title LIKE :keywords OR r.abstract LIKE :keywords OR r.tags LIKE :keywords)";
                $params[':keywords'] = '%' . $filters['keywords'] . '%';
            }

            $yearFrom = $filters['yearFrom'] ?? '';
            $yearTo = $filters['yearTo'] ?? '';

            if (!empty($yearFrom) || !empty($yearTo)) {
                if (!empty($yearFrom) && !empty($yearTo)) {
                    $sql .= " AND YEAR(r.publishedDate) >= :yearFrom AND YEAR(r.publishedDate) <= :yearTo";
                    $params[':yearFrom'] = (int)$yearFrom;
                    $params[':yearTo'] = (int)$yearTo;
                } elseif (!empty($yearFrom)) {
                    $sql .= " AND YEAR(r.publishedDate) >= :yearFrom";
                    $params[':yearFrom'] = (int)$yearFrom;
                } elseif (!empty($yearTo)) {
                    $sql .= " AND YEAR(r.publishedDate) <= :yearTo";
                    $params[':yearTo'] = (int)$yearTo;
                }
            }

            $sql .= " ORDER BY r.publishedDate DESC, r.created_at DESC";

            $stmt = $this->conn->prepare($sql);
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

            return $repositories;
        } catch (PDOException $e) {
            error_log("RepositoryModel getPublished Error: " . $e->getMessage());
            return [];
        }
    }

    public function getById($repositoryId, $publishedOnly = false) {
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
            
            if ($publishedOnly) {
                $sql .= " AND r.publishedStatus = 'published'";
            }

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':id' => (int)$repositoryId]);
            $repository = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$repository) {
                return null;
            }

            $repository['tags'] = $this->formatTags($repository['tags']);
            $repository['views'] = (int)($repository['views'] ?? 0);
            
            $verifyStmt = $this->conn->prepare("SELECT COALESCE(is_verified, 0) as is_verified FROM tbl_users WHERE user_id = :id");
            $verifyStmt->execute([':id' => (int)$repository['publisher']]);
            $verifyResult = $verifyStmt->fetch(PDO::FETCH_ASSOC);
            $repository['publisher_is_verified'] = $verifyResult ? (bool)((int)$verifyResult['is_verified']) : false;

            return $repository;
        } catch (PDOException $e) {
            error_log("RepositoryModel getById Error: " . $e->getMessage());
            return null;
        }
    }

    public function getByPublisher($userId) {
        try {
            error_log("RepositoryModel::getByPublisher called with userId=" . var_export($userId, true));
            
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

            error_log("RepositoryModel::getByPublisher SQL: " . $sql);
            
            $stmt = $this->conn->prepare($sql);
            $params = [
                ':user_id' => (int)$userId,
                ':current_user_id' => (int)$userId
            ];
            error_log("RepositoryModel::getByPublisher params: " . print_r($params, true));
            
            $stmt->execute($params);

            $repositories = $stmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("RepositoryModel::getByPublisher found " . count($repositories) . " repositories");

            $userModel = new UserModel($this->conn);
            $verificationMap = $userModel->getVerificationMap();

            foreach ($repositories as &$repo) {
                $repo['tags'] = $this->formatTags($repo['tags']);
                $repo['views'] = (int)($repo['views'] ?? 0);
                $repo['likes'] = (int)($repo['likes'] ?? 0);
                $repo['isLiked'] = (bool)((int)($repo['is_liked'] ?? 0));
                $repo['publisher_is_verified'] = $verificationMap[$repo['publisher']] ?? false;
            }

            return $repositories;
        } catch (PDOException $e) {
            error_log("RepositoryModel getByPublisher Error: " . $e->getMessage());
            return [];
        }
    }

    public function create($data) {
        try {
            $sql = "INSERT INTO tbl_repository (
                title, abstract, publisher, category, research_type, tags, pdfUrl, publishedStatus
            ) VALUES (
                :title, :abstract, :publisher, :category, :research_type, :tags, :pdfUrl, 'pending'
            )";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                ':title' => trim($data['title']),
                ':abstract' => trim($data['abstract']),
                ':publisher' => (int)$data['publisher'],
                ':category' => $data['category'] ?? '',
                ':research_type' => $data['research_type'] ?? null,
                ':tags' => $data['tags'] ?? '',
                ':pdfUrl' => $data['pdfUrl']
            ]);

            return [
                'success' => true,
                'id' => $this->conn->lastInsertId()
            ];
        } catch (PDOException $e) {
            error_log("RepositoryModel create Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function updateStatus($repositoryId, $status, $publishedDate = null) {
        try {
            $sql = "UPDATE tbl_repository SET publishedStatus = :status, updated_at = CURRENT_TIMESTAMP";
            $params = [':id' => (int)$repositoryId, ':status' => $status];

            if ($publishedDate) {
                $sql .= ", publishedDate = :publishedDate";
                $params[':publishedDate'] = $publishedDate;
            } elseif ($status === 'published') {
                $sql .= ", publishedDate = :publishedDate";
                $params[':publishedDate'] = date('Y-m-d');
            }

            $sql .= " WHERE id = :id";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);

            return ['success' => true];
        } catch (PDOException $e) {
            error_log("RepositoryModel updateStatus Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function incrementViewCount($repositoryId) {
        try {
            $stmt = $this->conn->prepare("UPDATE tbl_repository SET view_count = COALESCE(view_count, 0) + 1 WHERE id = :id");
            $stmt->execute([':id' => (int)$repositoryId]);
            return ['success' => true];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function getStats() {
        try {
            $stats = [];
            
            $stmt = $this->conn->prepare("SELECT COUNT(*) as total FROM tbl_repository");
            $stmt->execute();
            $stats['totalRepositories'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];

            $stmt = $this->conn->prepare("SELECT COUNT(*) as total FROM tbl_repository WHERE publishedStatus = 'pending'");
            $stmt->execute();
            $stats['pendingModeration'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];

            $stmt = $this->conn->prepare("SELECT COUNT(*) as total FROM tbl_repository WHERE publishedStatus = 'published' AND DATE(publishedDate) = CURDATE()");
            $stmt->execute();
            $stats['publishedToday'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];

            $stmt = $this->conn->prepare("SELECT COUNT(*) as total FROM tbl_repository WHERE publishedStatus = 'published'");
            $stmt->execute();
            $stats['totalPublished'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];

            return $stats;
        } catch (PDOException $e) {
            error_log("RepositoryModel getStats Error: " . $e->getMessage());
            return [];
        }
    }
}
