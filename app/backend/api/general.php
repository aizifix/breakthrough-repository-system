<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

date_default_timezone_set('Asia/Manila');

require_once '../config/db_connect.php';
require_once '../controllers/GeneralController.php';

$general = new GeneralController($pdo);

$operation = $_POST['operation'] ?? $_GET['operation'] ?? '';
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
        case "get_repositories":
            $filters = [];
            $userId = null;
            if (!empty($jsonData)) {
                $filters = [
                    'categories' => $jsonData['categories'] ?? [],
                    'keywords' => $jsonData['keywords'] ?? '',
                    'yearFrom' => $jsonData['yearFrom'] ?? '',
                    'yearTo' => $jsonData['yearTo'] ?? ''
                ];
                $userId = $jsonData['user_id'] ?? $jsonData['userId'] ?? null;
            } else {
                $filters = [
                    'categories' => $_POST['categories'] ?? $_GET['categories'] ?? [],
                    'keywords' => $_POST['keywords'] ?? $_GET['keywords'] ?? '',
                    'yearFrom' => $_POST['yearFrom'] ?? $_GET['yearFrom'] ?? '',
                    'yearTo' => $_POST['yearTo'] ?? $_GET['yearTo'] ?? ''
                ];
                $userId = $_POST['user_id'] ?? $_POST['userId'] ?? $_GET['user_id'] ?? $_GET['userId'] ?? null;
            }
            echo $general->getRepositories($filters, $userId);
            break;

        case "get_repository":
            $repositoryId = $_POST['repository_id'] ?? $_GET['repository_id'] ?? ($jsonData['repository_id'] ?? '');
            echo $general->getRepository($repositoryId);
            break;

        case "get_announcements":
            echo $general->getPublishedAnnouncements();
            break;

        default:
            error_log("Invalid operation requested: " . ($operation ?: "empty"));
            echo json_encode(["status" => "error", "message" => "Invalid operation: " . ($operation ?: "none provided")]);
            break;
    }
} catch (Exception $e) {
    error_log("Fatal error in general.php: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Server error occurred: " . $e->getMessage()]);
}
?>
