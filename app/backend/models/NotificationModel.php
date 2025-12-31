<?php

require_once __DIR__ . '/BaseModel.php';

class NotificationModel extends BaseModel {
    public function getByUser($userId, $unreadOnly = false) {
        try {
            $sql = "SELECT
                id,
                title,
                message,
                type,
                read_status,
                related_id,
                related_type,
                created_at
            FROM tbl_notifications
            WHERE user_id = :user_id";

            if ($unreadOnly) {
                $sql .= " AND read_status = 0";
            }

            $sql .= " ORDER BY created_at DESC LIMIT 50";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':user_id' => (int)$userId]);
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($notifications as &$notification) {
                $notification['read'] = (bool)$notification['read_status'];
                unset($notification['read_status']);
                $notification['time'] = $this->formatTimeAgo($notification['created_at']);
            }

            return $notifications;
        } catch (PDOException $e) {
            error_log("NotificationModel getByUser Error: " . $e->getMessage());
            return [];
        }
    }

    public function getUnreadCount($userId) {
        try {
            $stmt = $this->conn->prepare("SELECT COUNT(*) as count FROM tbl_notifications WHERE user_id = :user_id AND read_status = 0");
            $stmt->execute([':user_id' => (int)$userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int)$result['count'];
        } catch (PDOException $e) {
            error_log("NotificationModel getUnreadCount Error: " . $e->getMessage());
            return 0;
        }
    }

    public function markAsRead($notificationId, $userId) {
        try {
            $stmt = $this->conn->prepare("UPDATE tbl_notifications SET read_status = 1 WHERE id = :id AND user_id = :user_id");
            $stmt->execute([
                ':id' => (int)$notificationId,
                ':user_id' => (int)$userId
            ]);
            return ['success' => true];
        } catch (PDOException $e) {
            error_log("NotificationModel markAsRead Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function markAllAsRead($userId) {
        try {
            $stmt = $this->conn->prepare("UPDATE tbl_notifications SET read_status = 1 WHERE user_id = :user_id AND read_status = 0");
            $stmt->execute([':user_id' => (int)$userId]);
            return ['success' => true];
        } catch (PDOException $e) {
            error_log("NotificationModel markAllAsRead Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function createBulk($notifications) {
        try {
            if (empty($notifications)) {
                return ['success' => true];
            }

            $sql = "INSERT INTO tbl_notifications (user_id, title, message, type, related_id, related_type, read_status) VALUES ";
            $values = [];
            $params = [];

            foreach ($notifications as $index => $n) {
                $values[] = "(:user_id{$index}, :title{$index}, :message{$index}, :type{$index}, :related_id{$index}, :related_type{$index}, 0)";
                $params[":user_id{$index}"] = (int)$n['user_id'];
                $params[":title{$index}"] = $n['title'];
                $params[":message{$index}"] = $n['message'];
                $params[":type{$index}"] = $n['type'] ?? 'announcement';
                $params[":related_id{$index}"] = (int)$n['related_id'];
                $params[":related_type{$index}"] = $n['related_type'] ?? 'announcement';
            }

            $sql .= implode(", ", $values);
            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);

            return ['success' => true];
        } catch (PDOException $e) {
            error_log("NotificationModel createBulk Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    private function formatTimeAgo($datetime) {
        $timestamp = strtotime($datetime);
        $diff = time() - $timestamp;

        if ($diff < 60) return "just now";
        if ($diff < 3600) return floor($diff / 60) . " minute" . (floor($diff / 60) > 1 ? "s" : "") . " ago";
        if ($diff < 86400) return floor($diff / 3600) . " hour" . (floor($diff / 3600) > 1 ? "s" : "") . " ago";
        if ($diff < 604800) return floor($diff / 86400) . " day" . (floor($diff / 86400) > 1 ? "s" : "") . " ago";
        return date("M j, Y", $timestamp);
    }
}
