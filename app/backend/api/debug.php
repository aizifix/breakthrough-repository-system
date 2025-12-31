<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST");

require_once '../config/db_connect.php';

try {
    // Check database connection
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM tbl_repository");
    $totalRepos = $stmt->fetch(PDO::FETCH_ASSOC);

    // Check published repositories
    $stmt = $pdo->query("SELECT COUNT(*) as published FROM tbl_repository WHERE publishedStatus = 'published'");
    $publishedRepos = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get sample published repositories
    $stmt = $pdo->query("SELECT id, title, publishedStatus, publishedDate FROM tbl_repository WHERE publishedStatus = 'published' LIMIT 5");
    $samples = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "totalRepositories" => (int)$totalRepos['total'],
            "publishedRepositories" => (int)$publishedRepos['published'],
            "sampleRepositories" => $samples
        ]
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
}
?>
