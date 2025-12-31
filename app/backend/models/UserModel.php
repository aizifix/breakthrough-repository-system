<?php

require_once __DIR__ . '/BaseModel.php';

class UserModel extends BaseModel {
    public function getAll($role = null) {
        try {
            $sql = "SELECT
                u.user_id,
                u.user_name,
                u.user_email,
                u.user_role,
                u.user_school,
                u.user_department,
                u.user_type,
                u.user_contact,
                u.user_address,
                u.user_unique_id,
                u.student_id_number,
                u.student_id_image,
                u.created_at,
                COALESCE(u.is_verified, 0) as is_verified,
                COUNT(r.id) as repositories_count
            FROM tbl_users u
            LEFT JOIN tbl_repository r ON u.user_id = r.publisher";
            
            if ($role) {
                $sql .= " WHERE u.user_role = :role";
            }
            
            $sql .= " GROUP BY u.user_id ORDER BY u.created_at DESC";
            
            $stmt = $this->conn->prepare($sql);
            if ($role) {
                $stmt->execute([':role' => $role]);
            } else {
                $stmt->execute();
            }
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("UserModel getAll Error: " . $e->getMessage());
            return null;
        }
    }

    public function getById($userId) {
        try {
            $stmt = $this->conn->prepare("SELECT * FROM tbl_users WHERE user_id = :id");
            $stmt->execute([':id' => (int)$userId]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("UserModel getById Error: " . $e->getMessage());
            return null;
        }
    }

    public function getByEmail($email) {
        try {
            $stmt = $this->conn->prepare("SELECT * FROM tbl_users WHERE user_email = :email");
            $stmt->execute([':email' => $email]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("UserModel getByEmail Error: " . $e->getMessage());
            return null;
        }
    }

    public function create($data) {
        try {
            $hashedPassword = password_hash($data['user_pwd'], PASSWORD_DEFAULT);
            
            $sql = "INSERT INTO tbl_users (
                user_name, user_email, user_pwd, user_school,
                user_department, user_role, user_type, user_contact, user_address, user_unique_id,
                student_id_number, student_id_image
            ) VALUES (
                :user_name, :user_email, :user_pwd, :user_school,
                :user_department, :user_role, :user_type, :user_contact, :user_address, :user_unique_id,
                :student_id_number, :student_id_image
            )";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute([
                ':user_name' => trim($data['user_name']),
                ':user_email' => strtolower(trim($data['user_email'])),
                ':user_pwd' => $hashedPassword,
                ':user_school' => trim($data['user_school']),
                ':user_department' => trim($data['user_department']),
                ':user_role' => 'publisher',
                ':user_type' => $data['user_type'] ?? null,
                ':user_contact' => $data['user_contact'] ?? null,
                ':user_address' => $data['user_address'] ?? null,
                ':user_unique_id' => $data['user_unique_id'],
                ':student_id_number' => trim($data['student_id_number']),
                ':student_id_image' => $data['student_id_image'] ?? null
            ]);

            return [
                'success' => true,
                'user_id' => $this->conn->lastInsertId(),
                'user_unique_id' => $data['user_unique_id']
            ];
        } catch (PDOException $e) {
            error_log("UserModel create Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function update($userId, $data) {
        try {
            $updateFields = [];
            $params = [':id' => (int)$userId];

            $allowedFields = ['user_name', 'user_email', 'user_role', 'user_school', 'user_department', 'user_type'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateFields[] = "$field = :$field";
                    $params[":$field"] = $data[$field];
                }
            }

            if (empty($updateFields)) {
                return ['success' => false, 'message' => 'No fields to update'];
            }

            $updateFields[] = "updated_at = CURRENT_TIMESTAMP";
            $sql = "UPDATE tbl_users SET " . implode(", ", $updateFields) . " WHERE user_id = :id";

            $stmt = $this->conn->prepare($sql);
            $stmt->execute($params);

            return ['success' => true];
        } catch (PDOException $e) {
            error_log("UserModel update Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function updateStudentIdImage($userId, $studentIdImage) {
        try {
            $stmt = $this->conn->prepare("UPDATE tbl_users SET student_id_image = :student_id_image, updated_at = CURRENT_TIMESTAMP WHERE user_id = :id");
            $stmt->execute([
                ':id' => (int)$userId,
                ':student_id_image' => $studentIdImage
            ]);
            return ['success' => true];
        } catch (PDOException $e) {
            error_log("UserModel updateStudentIdImage Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function updateVerification($userId, $isVerified) {
        try {
            $stmt = $this->conn->prepare("UPDATE tbl_users SET is_verified = :is_verified, updated_at = CURRENT_TIMESTAMP WHERE user_id = :id");
            $stmt->execute([
                ':id' => (int)$userId,
                ':is_verified' => $isVerified ? 1 : 0
            ]);
            return ['success' => true];
        } catch (PDOException $e) {
            error_log("UserModel updateVerification Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function delete($userId) {
        try {
            $stmt = $this->conn->prepare("DELETE FROM tbl_users WHERE user_id = :id");
            $stmt->execute([':id' => (int)$userId]);
            return ['success' => true, 'rowCount' => $stmt->rowCount()];
        } catch (PDOException $e) {
            error_log("UserModel delete Error: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function getNextUniqueId() {
        try {
            $stmt = $this->conn->prepare("SELECT user_unique_id FROM tbl_users WHERE user_unique_id LIKE 'COC-BT-%' ORDER BY user_unique_id DESC LIMIT 1");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result && $result['user_unique_id']) {
                $parts = explode('-', $result['user_unique_id']);
                $lastNumber = isset($parts[2]) ? (int)$parts[2] : 0;
                $nextNumber = $lastNumber + 1;
            } else {
                $nextNumber = 1;
            }

            return "COC-BT-" . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
        } catch (PDOException $e) {
            return "COC-BT-" . str_pad(1, 6, '0', STR_PAD_LEFT);
        }
    }

    public function getVerificationMap() {
        try {
            $stmt = $this->conn->prepare("SELECT user_id, COALESCE(is_verified, 0) as is_verified FROM tbl_users");
            $stmt->execute();
            $verifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $map = [];
            foreach ($verifications as $v) {
                $map[$v['user_id']] = (bool)((int)$v['is_verified']);
            }
            return $map;
        } catch (PDOException $e) {
            return [];
        }
    }
}
