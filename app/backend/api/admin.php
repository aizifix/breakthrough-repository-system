<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

date_default_timezone_set('Asia/Manila');

require_once '../config/db_connect.php';
require_once '../controllers/AdminController.php';

$admin = new AdminController($pdo);

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
        case "get_repositories_moderation":
            echo $admin->getRepositoriesForModeration();
            break;

        case "approve_repository":
            $repositoryId = $_POST['repository_id'] ?? ($jsonData['repository_id'] ?? '');
            $publishedDate = $_POST['published_date'] ?? ($jsonData['published_date'] ?? null);
            echo $admin->approveRepository($repositoryId, $publishedDate);
            break;

        case "reject_repository":
            $repositoryId = $_POST['repository_id'] ?? ($jsonData['repository_id'] ?? '');
            echo $admin->rejectRepository($repositoryId);
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
    echo json_encode(["status" => "error", "message" => "Server error occurred: " . $e->getMessage()]);
}
?>
