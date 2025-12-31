<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle OPTIONS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

echo json_encode([
    "status" => "success",
    "message" => "API is accessible",
    "received" => [
        "operation" => $_POST['operation'] ?? 'none',
        "user_id" => $_POST['user_id'] ?? 'none',
    ],
    "timestamp" => date('Y-m-d H:i:s')
]);
?>
