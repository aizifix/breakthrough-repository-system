<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Set timezone
date_default_timezone_set('Asia/Manila');

require_once 'db_connect.php';

// Notifications class
class Notifications {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Get notifications for a user
    public function getNotifications($userId, $unreadOnly = false) {
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

            // Format dates
            foreach ($notifications as &$notification) {
                $notification['read'] = (bool)$notification['read_status'];
                unset($notification['read_status']);
                $notification['time'] = $this->formatTimeAgo($notification['created_at']);
            }

            return json_encode([
                "status" => "success",
                "data" => $notifications
            ]);
        } catch (PDOException $e) {
            error_log("Notifications getNotifications PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Mark notification as read
    public function markAsRead($notificationId, $userId) {
        try {
            $stmt = $this->conn->prepare("UPDATE tbl_notifications
                                         SET read_status = 1
                                         WHERE id = :id AND user_id = :user_id");
            $stmt->execute([
                ':id' => (int)$notificationId,
                ':user_id' => (int)$userId
            ]);

            return json_encode([
                "status" => "success",
                "message" => "Notification marked as read"
            ]);
        } catch (PDOException $e) {
            error_log("Notifications markAsRead PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Mark all notifications as read for a user
    public function markAllAsRead($userId) {
        try {
            $stmt = $this->conn->prepare("UPDATE tbl_notifications
                                         SET read_status = 1
                                         WHERE user_id = :user_id AND read_status = 0");
            $stmt->execute([':user_id' => (int)$userId]);

            return json_encode([
                "status" => "success",
                "message" => "All notifications marked as read"
            ]);
        } catch (PDOException $e) {
            error_log("Notifications markAllAsRead PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Get unread count
    public function getUnreadCount($userId) {
        try {
            $stmt = $this->conn->prepare("SELECT COUNT(*) as count
                                         FROM tbl_notifications
                                         WHERE user_id = :user_id AND read_status = 0");
            $stmt->execute([':user_id' => (int)$userId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return json_encode([
                "status" => "success",
                "count" => (int)$result['count']
            ]);
        } catch (PDOException $e) {
            error_log("Notifications getUnreadCount PDO Error: " . $e->getMessage());
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Helper function to format time ago
    private function formatTimeAgo($datetime) {
        $timestamp = strtotime($datetime);
        $diff = time() - $timestamp;

        if ($diff < 60) {
            return "just now";
        } elseif ($diff < 3600) {
            $mins = floor($diff / 60);
            return $mins . " minute" . ($mins > 1 ? "s" : "") . " ago";
        } elseif ($diff < 86400) {
            $hours = floor($diff / 3600);
            return $hours . " hour" . ($hours > 1 ? "s" : "") . " ago";
        } elseif ($diff < 604800) {
            $days = floor($diff / 86400);
            return $days . " day" . ($days > 1 ? "s" : "") . " ago";
        } else {
            return date("M j, Y", $timestamp);
        }
    }
}

// Initialize Notifications class
try {
    $notifications = new Notifications($pdo);
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

// Handle API operations
try {
    switch ($operation) {
        case "get_notifications":
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? '');
            $unreadOnly = isset($_POST['unread_only']) ? (bool)$_POST['unread_only'] : (isset($jsonData['unread_only']) ? (bool)$jsonData['unread_only'] : false);
            echo $notifications->getNotifications($userId, $unreadOnly);
            break;

        case "mark_as_read":
            $notificationId = $_POST['notification_id'] ?? ($jsonData['notification_id'] ?? '');
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? '');
            echo $notifications->markAsRead($notificationId, $userId);
            break;

        case "mark_all_as_read":
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? '');
            echo $notifications->markAllAsRead($userId);
            break;

        case "get_unread_count":
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? '');
            echo $notifications->getUnreadCount($userId);
            break;

        default:
            error_log("Invalid operation requested: " . ($operation ?: "empty"));
            echo json_encode(["status" => "error", "message" => "Invalid operation: " . ($operation ?: "none provided")]);
            break;
    }
} catch (Exception $e) {
    error_log("Fatal error in notifications.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    echo json_encode(["status" => "error", "message" => "Server error occurred: " . $e->getMessage()]);
}
?>
