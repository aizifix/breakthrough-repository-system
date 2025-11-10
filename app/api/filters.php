<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db_connect.php';

// Get operation from request
$operation = $_GET['operation'] ?? $_POST['operation'] ?? '';

try {
    switch ($operation) {
        case "get_departments":
            $stmt = $pdo->prepare("SELECT id, name, description FROM tbl_department WHERE is_active = 1 ORDER BY name ASC");
            $stmt->execute();
            $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode([
                "status" => "success",
                "data" => $departments
            ]);
            break;

        case "get_research_types":
            $stmt = $pdo->prepare("SELECT id, name, description FROM tbl_research_type WHERE is_active = 1 ORDER BY name ASC");
            $stmt->execute();
            $researchTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode([
                "status" => "success",
                "data" => $researchTypes
            ]);
            break;

        case "get_categories":
            $stmt = $pdo->prepare("SELECT id, name, description FROM tbl_category WHERE is_active = 1 ORDER BY name ASC");
            $stmt->execute();
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode([
                "status" => "success",
                "data" => $categories
            ]);
            break;

        case "get_all_filters":
            // Get all filter options in one call
            $departments = $pdo->query("SELECT id, name, description FROM tbl_department WHERE is_active = 1 ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);
            $researchTypes = $pdo->query("SELECT id, name, description FROM tbl_research_type WHERE is_active = 1 ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);
            $categories = $pdo->query("SELECT id, name, description FROM tbl_category WHERE is_active = 1 ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "status" => "success",
                "data" => [
                    "departments" => $departments,
                    "researchTypes" => $researchTypes,
                    "categories" => $categories
                ]
            ]);
            break;

        default:
            echo json_encode([
                "status" => "error",
                "message" => "Invalid operation. Use: get_departments, get_research_types, get_categories, or get_all_filters"
            ]);
            break;
    }
} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>
