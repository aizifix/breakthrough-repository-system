<?php

require_once __DIR__ . '/BaseModel.php';

class AnnouncementModel extends BaseModel {
    public function getAll($publishedOnly = false) {
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
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("AnnouncementModel getAll Error: " . $e->getMessage());
            return [];
        }
    }

    public function getById($announcementId) {
        try {
            $stmt = $this->conn->prepare("SELECT * FROM tbl_announcements WHERE id = :id");
            $stmt->execute([':id' => (int)$announcementId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("AnnouncementModel getById Error: " . $e->getMessage());
            return null;
        }
    }

    public function create($data) {
        try {
            $stmt = $this->conn->prepare("INSERT INTO tbl_announcements (title, content, published, created_by)
                    VALUES (:title, :content, :published, :created_by)");

            $stmt->execute([
                ':title' => $data['title'],
                ':content' => $data['content'],
                ':published' => isset($data['published']) ? (int)$data['published'] : 0,
                ':created_by' => (int)$data['created_by']
            ]);

            return [
                'success' => true,
                'id' => $this->conn->lastInsertId()
            ];
        } catch (PDOException $e) {
            error_log("AnnouncementModel create Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function update($announcementId, $data) {
        try {
            $stmt = $this->conn->prepare("UPDATE tbl_announcements SET
                    title = :title,
                    content = :content,
                    published = :published,
                    updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id");

            $stmt->execute([
                ':title' => $data['title'],
                ':content' => $data['content'],
                ':published' => (int)$data['published'],
                ':id' => (int)$announcementId
            ]);

            return ['success' => true];
        } catch (PDOException $e) {
            error_log("AnnouncementModel update Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function delete($announcementId) {
        try {
            $stmt = $this->conn->prepare("DELETE FROM tbl_announcements WHERE id = :id");
            $stmt->execute([':id' => (int)$announcementId]);
            return ['success' => true, 'rowCount' => $stmt->rowCount()];
        } catch (PDOException $e) {
            error_log("AnnouncementModel delete Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }
}
