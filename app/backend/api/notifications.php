<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

date_default_timezone_set('Asia/Manila');

require_once '../config/db_connect.php';
require_once '../controllers/NotificationsController.php';

$notifications = new NotificationsController($pdo);

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
    echo json_encode(["status" => "error", "message" => "Server error occurred: " . $e->getMessage()]);
}
?>
