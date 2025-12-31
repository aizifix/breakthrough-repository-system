<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

require_once 'config/db_connect.php';

try {
    // Test database connection
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM tbl_users");
    $users = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $pdo->query("SELECT COUNT(*) as total FROM tbl_repository");
    $repos = $stmt->fetch(PDO::FETCH_ASSOC);

    $stmt = $pdo->query("SELECT user_id, user_name, user_email FROM tbl_users LIMIT 5");
    $userSamples = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "totalUsers" => (int)$users['total'],
            "totalRepositories" => (int)$repos['total'],
            "sampleUsers" => $userSamples
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
