<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/db_connect.php';
require_once '../controllers/FiltersController.php';

$filters = new FiltersController($pdo);

$operation = $_GET['operation'] ?? $_POST['operation'] ?? '';

try {
    switch ($operation) {
        case "get_departments":
            echo $filters->getDepartments();
            break;

        case "get_research_types":
            echo $filters->getResearchTypes();
            break;

        case "get_categories":
            echo $filters->getCategories();
            break;

        case "get_all_filters":
            echo $filters->getAllFilters();
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
