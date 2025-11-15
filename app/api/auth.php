<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Set timezone
date_default_timezone_set('Asia/Manila');

require_once 'db_connect.php';

// Auth class with function-based OOP structure
class Auth {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Generate unique user ID in format COC-BT-XXXXXX
    private function generateUniqueId() {
        // Get the highest existing number from user_unique_id
        $stmt = $this->conn->prepare("SELECT user_unique_id FROM tbl_users WHERE user_unique_id LIKE 'COC-BT-%' ORDER BY user_unique_id DESC LIMIT 1");
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($result && $result['user_unique_id']) {
            // Extract the number part and increment
            $parts = explode('-', $result['user_unique_id']);
            $lastNumber = isset($parts[2]) ? (int)$parts[2] : 0;
            $nextNumber = $lastNumber + 1;
        } else {
            // Start from 1 if no existing IDs
            $nextNumber = 1;
        }

        // Format as 6-digit number with leading zeros
        $formattedNumber = str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

        return "COC-BT-" . $formattedNumber;
    }

    // Register new user
    public function register($data) {
        try {
            $this->conn->beginTransaction();

            // Required fields validation
            $required = ['user_name', 'user_email', 'user_pwd', 'user_school', 'user_department'];

            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return json_encode(["status" => "error", "message" => "$field is required"]);
                }
            }

            // Validate email format
            if (!filter_var($data['user_email'], FILTER_VALIDATE_EMAIL)) {
                return json_encode(["status" => "error", "message" => "Invalid email format"]);
            }

            // Check if email already exists
            $stmt = $this->conn->prepare("SELECT user_id FROM tbl_users WHERE user_email = ?");
            $stmt->execute([$data['user_email']]);
            if ($stmt->rowCount() > 0) {
                return json_encode(["status" => "error", "message" => "Email already exists"]);
            }

            // Hash password
            $hashedPassword = password_hash($data['user_pwd'], PASSWORD_DEFAULT);

            // Generate unique user ID
            $uniqueId = $this->generateUniqueId();

            // Insert into tbl_users
            $sql = "INSERT INTO tbl_users (
                user_name, user_email, user_pwd, user_school,
                user_department, user_role, user_type, user_contact, user_address, user_unique_id
            ) VALUES (
                :user_name, :user_email, :user_pwd, :user_school,
                :user_department, :user_role, :user_type, :user_contact, :user_address, :user_unique_id
            )";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                ':user_name' => trim($data['user_name']),
                ':user_email' => strtolower(trim($data['user_email'])),
                ':user_pwd' => $hashedPassword,
                ':user_school' => trim($data['user_school']),
                ':user_department' => trim($data['user_department']),
                ':user_role' => 'publisher', // Default role
                ':user_type' => $data['user_type'] ?? null,
                ':user_contact' => $data['user_contact'] ?? null,
                ':user_address' => $data['user_address'] ?? null,
                ':user_unique_id' => $uniqueId
            ]);

            $userId = $this->conn->lastInsertId();

            $this->conn->commit();

            return json_encode([
                "status" => "success",
                "message" => "Registration successful!",
                "user_id" => $userId,
                "user_unique_id" => $uniqueId
            ]);
        } catch (PDOException $e) {
            $this->conn->rollBack();
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Login user
    public function login($email, $password) {
        try {
            if (empty($email) || empty($password)) {
                return json_encode(["status" => "error", "message" => "Email and password are required."]);
            }

            // Find user by email
            $sql = "SELECT * FROM tbl_users WHERE user_email = :email";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':email' => $email]);

            if ($stmt->rowCount() === 0) {
                return json_encode(["status" => "error", "message" => "User not found."]);
            }

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Verify password
            if (!password_verify($password, $user['user_pwd'])) {
                return json_encode(["status" => "error", "message" => "Invalid password."]);
            }

            // Update last login timestamp
            $this->conn->prepare("UPDATE tbl_users SET updated_at = NOW() WHERE user_id = :user_id")
                ->execute([':user_id' => $user['user_id']]);

            // Prepare user data (remove password)
            unset($user['user_pwd']);
            $user['user_role'] = $user['user_role'] ?? 'publisher'; // Ensure role is set

            return json_encode([
                "status" => "success",
                "message" => "Login successful!",
                "user" => $user
            ]);
        } catch (PDOException $e) {
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Logout user (optional, for logging purposes)
    public function logout($userId) {
        try {
            if (empty($userId)) {
                return json_encode(["status" => "error", "message" => "Missing user_id"]);
            }

            // Update last activity or log logout
            // For now, just return success
            return json_encode(["status" => "success", "message" => "Logout successful"]);
        } catch (Exception $e) {
            return json_encode(["status" => "error", "message" => "Logout failed"]);
        }
    }

    // Get user by email
    public function getUserByEmail($email) {
        try {
            if (empty($email)) {
                return json_encode(["status" => "error", "message" => "Email is required"]);
            }

            $sql = "SELECT user_id, user_name, user_email, user_role, user_school, user_department, user_type, user_contact, user_address, user_unique_id FROM tbl_users WHERE user_email = :email";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':email' => $email]);

            if ($stmt->rowCount() === 0) {
                return json_encode(["status" => "error", "message" => "User not found"]);
            }

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Try to get is_verified separately if column exists
            try {
                $verifyStmt = $this->conn->prepare("SELECT COALESCE(is_verified, 0) as is_verified FROM tbl_users WHERE user_email = :email");
                $verifyStmt->execute([':email' => $email]);
                $verifyResult = $verifyStmt->fetch(PDO::FETCH_ASSOC);
                if ($verifyResult) {
                    $user['is_verified'] = (bool)((int)$verifyResult['is_verified']);
                } else {
                    $user['is_verified'] = false;
                }
            } catch (PDOException $e) {
                // Column doesn't exist, default to false
                error_log("is_verified column may not exist: " . $e->getMessage());
                $user['is_verified'] = false;
            }

            return json_encode([
                "status" => "success",
                "user" => $user
            ]);
        } catch (PDOException $e) {
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }

    // Get user profile by user ID
    public function getUserProfile($userId) {
        try {
            if (empty($userId)) {
                return json_encode(["status" => "error", "message" => "User ID is required"]);
            }

            $sql = "SELECT user_id, user_name, user_email, user_role, user_school, user_department, user_type, user_contact, user_address, user_unique_id FROM tbl_users WHERE user_id = :user_id";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([':user_id' => $userId]);

            if ($stmt->rowCount() === 0) {
                return json_encode(["status" => "error", "message" => "User not found"]);
            }

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Try to get is_verified separately if column exists
            try {
                $verifyStmt = $this->conn->prepare("SELECT COALESCE(is_verified, 0) as is_verified FROM tbl_users WHERE user_id = :user_id");
                $verifyStmt->execute([':user_id' => $userId]);
                $verifyResult = $verifyStmt->fetch(PDO::FETCH_ASSOC);
                if ($verifyResult) {
                    $user['is_verified'] = (bool)((int)$verifyResult['is_verified']);
                } else {
                    $user['is_verified'] = false;
                }
            } catch (PDOException $e) {
                // Column doesn't exist, default to false
                error_log("is_verified column may not exist: " . $e->getMessage());
                $user['is_verified'] = false;
            }

            return json_encode([
                "status" => "success",
                "user" => $user
            ]);
        } catch (PDOException $e) {
            return json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }
}

// Initialize Auth class
try {
    $auth = new Auth($pdo);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "System initialization failed"]);
    exit;
}

// Get operation from request
$operation = $_POST['operation'] ?? '';
$jsonData = null;

if (empty($operation)) {
    $jsonData = json_decode(file_get_contents("php://input"), true);
    if (isset($jsonData['operation'])) {
        $operation = $jsonData['operation'];
    }
} else {
    $jsonData = json_decode(file_get_contents("php://input"), true);
}

// Handle API operations using switch case
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

        case "get_user_by_email":
            $email = $_POST['email'] ?? ($jsonData['email'] ?? '');
            echo $auth->getUserByEmail($email);
            break;

        case "get_user_profile":
            $userId = $_POST['user_id'] ?? ($jsonData['user_id'] ?? '');
            echo $auth->getUserProfile($userId);
            break;

        default:
            echo json_encode(["status" => "error", "message" => "Invalid operation."]);
            break;
    }
} catch (Exception $e) {
    error_log("Fatal error in auth.php: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Server error occurred"]);
}
?>
