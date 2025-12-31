<?php

require_once __DIR__ . '/../models/UserModel.php';

class AuthController {
    private $userModel;
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
        $this->userModel = new UserModel($db);
    }

    public function register($data) {
        $required = ['user_name', 'user_email', 'user_pwd', 'user_school', 'user_department', 'student_id_number', 'student_id_image'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return json_encode(["status" => "error", "message" => "$field is required"]);
            }
        }

        if (!filter_var($data['user_email'], FILTER_VALIDATE_EMAIL)) {
            return json_encode(["status" => "error", "message" => "Invalid email format"]);
        }

        $existing = $this->userModel->getByEmail($data['user_email']);
        if ($existing) {
            return json_encode(["status" => "error", "message" => "Email already exists"]);
        }

        $data['user_unique_id'] = $this->userModel->getNextUniqueId();

        $result = $this->userModel->create($data);
        if ($result['success']) {
            return json_encode([
                "status" => "success",
                "message" => "Registration successful!",
                "user_id" => $result['user_id'],
                "user_unique_id" => $result['user_unique_id']
            ]);
        } else {
            return json_encode(["status" => "error", "message" => $result['message']]);
        }
    }

    public function login($email, $password) {
        if (empty($email) || empty($password)) {
            return json_encode(["status" => "error", "message" => "Email and password are required."]);
        }

        $user = $this->userModel->getByEmail($email);
        if (!$user) {
            return json_encode(["status" => "error", "message" => "User not found."]);
        }

        if (!password_verify($password, $user['user_pwd'])) {
            return json_encode(["status" => "error", "message" => "Invalid password."]);
        }

        unset($user['user_pwd']);
        $user['user_role'] = $user['user_role'] ?? 'publisher';

        return json_encode([
            "status" => "success",
            "message" => "Login successful!",
            "user" => $user
        ]);
    }

    public function logout($userId) {
        return json_encode(["status" => "success", "message" => "Logout successful"]);
    }

    public function getUserProfile($userId) {
        $user = $this->userModel->getById($userId);
        if (!$user) {
            return json_encode(["status" => "error", "message" => "User not found"]);
        }

        unset($user['user_pwd']);
        return json_encode(["status" => "success", "user" => $user]);
    }

    public function getUserByEmail($email) {
        $user = $this->userModel->getByEmail($email);
        if (!$user) {
            return json_encode(["status" => "error", "message" => "User not found"]);
        }

        unset($user['user_pwd']);
        return json_encode(["status" => "success", "user" => $user]);
    }

    public function updateProfile($data) {
        $userId = $data['user_id'] ?? '';
        if (empty($userId)) {
            return json_encode(["status" => "error", "message" => "User ID is required"]);
        }

        $user = $this->userModel->getById($userId);
        if (!$user) {
            return json_encode(["status" => "error", "message" => "User not found"]);
        }

        $result = $this->userModel->update($userId, $data);
        if ($result['success']) {
            return json_encode(["status" => "success", "message" => "Profile updated successfully"]);
        } else {
            return json_encode(["status" => "error", "message" => $result['message']]);
        }
    }

    public function uploadStudentId($userId) {
        if (empty($userId)) {
            return json_encode(["status" => "error", "message" => "User ID is required"]);
        }

        if (!isset($_FILES['student_id_image']) || $_FILES['student_id_image']['error'] !== UPLOAD_ERR_OK) {
            $error = $_FILES['student_id_image']['error'] ?? UPLOAD_ERR_NO_FILE;
            $errorMsg = "No file uploaded or upload error occurred";
            if ($error === UPLOAD_ERR_INI_SIZE) {
                $errorMsg = "File too large (server limit exceeded)";
            } elseif ($error === UPLOAD_ERR_FORM_SIZE) {
                $errorMsg = "File too large (form limit exceeded)";
            } elseif ($error === UPLOAD_ERR_PARTIAL) {
                $errorMsg = "File was only partially uploaded";
            }
            return json_encode(["status" => "error", "message" => $errorMsg]);
        }

        $file = $_FILES['student_id_image'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        $maxSize = 5 * 1024 * 1024; // 5MB

        if (!in_array($file['type'], $allowedTypes)) {
            return json_encode(["status" => "error", "message" => "Invalid file type. Allowed: JPEG, PNG, GIF, PDF"]);
        }

        if ($file['size'] > $maxSize) {
            return json_encode(["status" => "error", "message" => "File too large. Maximum size is 5MB"]);
        }

        $uploadDir = __DIR__ . '/../uploads/student_ids/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $newFileName = 'student_id_' . $userId . '_' . time() . '.' . $extension;
        $targetPath = $uploadDir . $newFileName;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $relativePath = 'uploads/student_ids/' . $newFileName;
            $result = $this->userModel->updateStudentIdImage($userId, $relativePath);
            
            if ($result['success']) {
                return json_encode([
                    "status" => "success", 
                    "message" => "Student ID uploaded successfully. Please wait for admin verification.",
                    "student_id_image" => $relativePath
                ]);
            } else {
                return json_encode(["status" => "error", "message" => "Failed to save student ID path"]);
            }
        } else {
            return json_encode(["status" => "error", "message" => "Failed to upload file"]);
        }
    }
}
