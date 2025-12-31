<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

date_default_timezone_set('Asia/Manila');

require_once '../config/db_connect.php';
require_once '../controllers/AuthController.php';

$auth = new AuthController($pdo);

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (strpos($contentType, 'multipart/form-data') !== false) {
    $operation = $_POST['operation'] ?? '';
    $jsonData = null;
} else {
    $operation = $_POST['operation'] ?? '';
    $jsonData = json_decode(file_get_contents("php://input"), true);
    
    if (empty($operation) && isset($jsonData['operation'])) {
        $operation = $jsonData['operation'];
    }
}

try {
    switch ($operation) {
        case "register":
            $data = !empty($jsonData) ? $jsonData : $_POST;
            echo $auth->register($data);
            break;

        case "login":
            $email = $_POST['email'] ?? ($jsonData['email'] ?? '');
            $password = $_POST['password'] ?? ($jsonData['password'] ?? '');
            echo $auth->login($email, $password);
            break;

        case "logout":
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? '');
            echo $auth->logout($userId);
            break;

        case "get_user_profile":
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? '');
            echo $auth->getUserProfile($userId);
            break;

        case "get_user_by_email":
            $email = $_POST['email'] ?? ($jsonData['email'] ?? '');
            echo $auth->getUserByEmail($email);
            break;

        case "update_profile":
            $data = !empty($jsonData) ? $jsonData : $_POST;
            echo $auth->updateProfile($data);
            break;

        case "upload_student_id":
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? '');
            if (empty($userId)) {
                echo json_encode(["status" => "error", "message" => "User ID is required"]);
                break;
            }
            echo $auth->uploadStudentId($userId);
            break;

        default:
            echo json_encode(["status" => "error", "message" => "Invalid operation: " . $operation]);
            break;
    }
} catch (Exception $e) {
    error_log("Fatal error in auth.php: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Server error occurred: " . $e->getMessage()]);
}
?>
