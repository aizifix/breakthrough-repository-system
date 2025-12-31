<?php
header("Content-Type: application/json");

echo json_encode([
    "status" => "success",
    "message" => "API is working",
    "post_data" => $_POST,
    "files_data" => isset($_FILES) ? array_keys($_FILES) : [],
    "content_type" => $_SERVER['CONTENT_TYPE'] ?? 'not set'
]);
?>
