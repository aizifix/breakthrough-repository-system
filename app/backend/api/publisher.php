<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle OPTIONS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set('Asia/Manila');

require_once '../config/db_connect.php';
require_once '../controllers/PublisherController.php';

$publisher = new PublisherController($pdo);

$operation = '';
$jsonData = null;

$contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
$isJsonRequest = strpos(strtolower($contentType), 'application/json') !== false;

$input = file_get_contents("php://input");
$hasInput = !empty($input);

if ($isJsonRequest || ($hasInput && empty($_POST))) {
    $jsonData = json_decode($input, true);
    if ($jsonData === null) {
        parse_str($input, $jsonData);
    }
    $operation = $jsonData['operation'] ?? '';
} else {
    $operation = $_POST['operation'] ?? '';
    $jsonData = $_POST;
}

error_log("Publisher API - Request Method: " . $_SERVER['REQUEST_METHOD']);
error_log("Publisher API - Input: " . file_get_contents("php://input"));
error_log("Publisher API - Operation: " . ($operation ?: "empty"));

try {
    switch ($operation) {
        case "create_repository":
            $data = !empty($jsonData) ? $jsonData : $_POST;
            $pdfFile = isset($_FILES['pdfFile']) ? $_FILES['pdfFile'] : null;
            if (empty($data)) {
                echo json_encode(["status" => "error", "message" => "No data received"]);
                break;
            }
            echo $publisher->createRepository($data, $pdfFile);
            break;

        case "get_repositories":
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? null);
            $currentUserId = $_POST['current_user_id'] ?? ($jsonData['current_user_id'] ?? $_POST['userId'] ?? $jsonData['userId'] ?? null);
            error_log("Publisher API - get_repositories: userId=" . var_export($userId, true) . ", currentUserId=" . var_export($currentUserId, true));
            echo $publisher->getRepositories($userId, $currentUserId);
            break;

        case "get_saved_repositories":
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? null);
            error_log("Publisher API - get_saved_repositories: userId=" . var_export($userId, true));
            echo $publisher->getSavedRepositories($userId);
            break;

        case "get_repository":
            $repositoryId = $_POST['repository_id'] ?? ($jsonData['repository_id'] ?? '');
            echo $publisher->getRepositoryById($repositoryId);
            break;

        case "update_repository":
            $repositoryId = $_POST['repository_id'] ?? ($jsonData['repository_id'] ?? '');
            $data = !empty($jsonData) ? $jsonData : $_POST;
            $data['repository_id'] = $repositoryId;
            $pdfFile = isset($_FILES['pdfFile']) ? $_FILES['pdfFile'] : null;
            echo $publisher->updateRepository($repositoryId, $data, $pdfFile);
            break;

        case "delete_repository":
            $repositoryId = $_POST['repository_id'] ?? ($jsonData['repository_id'] ?? '');
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? '');
            echo $publisher->deleteRepository($repositoryId, $userId);
            break;

        case "rate_repository":
            $repositoryId = $jsonData['repository_id'] ?? ($_POST['repository_id'] ?? '');
            $userId = $jsonData['user_id'] ?? ($_POST['user_id'] ?? '');
            $rating = $jsonData['rating'] ?? ($_POST['rating'] ?? '');
            if (empty($repositoryId) || empty($userId) || empty($rating)) {
                echo json_encode(["status" => "error", "message" => "Repository ID, User ID, and Rating are required"]);
                break;
            }
            echo $publisher->rateRepository($repositoryId, $userId, $rating);
            break;

        case "toggle_like":
            $repositoryId = $jsonData['repository_id'] ?? ($_POST['repository_id'] ?? '');
            $userId = $jsonData['user_id'] ?? ($_POST['user_id'] ?? '');
            if (empty($repositoryId) || empty($userId)) {
                echo json_encode(["status" => "error", "message" => "Repository ID and User ID are required"]);
                break;
            }
            echo $publisher->toggleLike($repositoryId, $userId);
            break;

        case "add_comment":
            $repositoryId = $jsonData['repository_id'] ?? ($_POST['repository_id'] ?? '');
            $userId = $jsonData['user_id'] ?? ($_POST['user_id'] ?? '');
            $comment = $jsonData['comment'] ?? ($_POST['comment'] ?? '');
            $parentCommentId = $jsonData['parent_comment_id'] ?? ($_POST['parent_comment_id'] ?? null);
            if (empty($repositoryId) || empty($userId) || empty($comment)) {
                echo json_encode(["status" => "error", "message" => "Repository ID, User ID, and Comment are required"]);
                break;
            }
            echo $publisher->addComment($repositoryId, $userId, $comment, $parentCommentId);
            break;

        case "get_repository_comments":
            $repositoryId = $jsonData['repository_id'] ?? ($_POST['repository_id'] ?? '');
            $limit = $jsonData['limit'] ?? ($_POST['limit'] ?? 50);
            $offset = $jsonData['offset'] ?? ($_POST['offset'] ?? 0);
            if (empty($repositoryId)) {
                echo json_encode(["status" => "error", "message" => "Repository ID is required"]);
                break;
            }
            echo $publisher->getComments($repositoryId, $limit, $offset);
            break;

        case "delete_comment":
            $commentId = $jsonData['comment_id'] ?? ($_POST['comment_id'] ?? '');
            $userId = $jsonData['user_id'] ?? ($_POST['user_id'] ?? '');
            if (empty($commentId) || empty($userId)) {
                echo json_encode(["status" => "error", "message" => "Comment ID and User ID are required"]);
                break;
            }
            echo $publisher->deleteComment($commentId, $userId);
            break;

        case "increment_view":
            $repositoryId = $jsonData['repository_id'] ?? ($_POST['repository_id'] ?? '');
            if (empty($repositoryId)) {
                echo json_encode(["status" => "error", "message" => "Repository ID is required"]);
                break;
            }
            echo $publisher->incrementViewCount($repositoryId);
            break;

        default:
            error_log("Invalid operation requested: " . ($operation ?: "empty"));
            echo json_encode(["status" => "error", "message" => "Invalid operation: " . ($operation ?: "none provided")]);
            break;
    }
} catch (Exception $e) {
    error_log("Fatal error in publisher.php: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Server error occurred: " . $e->getMessage()]);
}
?>
