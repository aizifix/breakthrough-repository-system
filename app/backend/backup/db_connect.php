<?php

// Database connection parameters
$host = 'localhost';
$dbname = 'repository-api';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

    // Set comprehensive collation settings to handle string concatenation issues
    $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
    $pdo->exec("SET SESSION collation_connection = 'utf8mb4_general_ci'");
    $pdo->exec("SET SESSION collation_database = 'utf8mb4_general_ci'");
    $pdo->exec("SET SESSION collation_server = 'utf8mb4_general_ci'");
    $pdo->exec("SET SESSION character_set_connection = 'utf8mb4'");
    $pdo->exec("SET SESSION character_set_database = 'utf8mb4'");
    $pdo->exec("SET SESSION character_set_server = 'utf8mb4'");
    $pdo->exec("SET SESSION sql_mode = ''");
    $pdo->exec("SET SESSION collation_connection = 'utf8mb4_general_ci'");
} catch(PDOException $e) {
    die("ERROR: Could not connect. " . $e->getMessage());
}

?>
