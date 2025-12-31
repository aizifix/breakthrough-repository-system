<?php

require_once __DIR__ . '/BaseModel.php';

class FilterModel extends BaseModel {
    public function getDepartments() {
        try {
            $stmt = $this->conn->prepare("SELECT id, name, description FROM tbl_department WHERE is_active = 1 ORDER BY name ASC");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("FilterModel getDepartments Error: " . $e->getMessage());
            return [];
        }
    }

    public function getResearchTypes() {
        try {
            $stmt = $this->conn->prepare("SELECT id, name, description FROM tbl_research_type WHERE is_active = 1 ORDER BY name ASC");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("FilterModel getResearchTypes Error: " . $e->getMessage());
            return [];
        }
    }

    public function getCategories() {
        try {
            $stmt = $this->conn->prepare("SELECT id, name, description FROM tbl_category WHERE is_active = 1 ORDER BY name ASC");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("FilterModel getCategories Error: " . $e->getMessage());
            return [];
        }
    }

    public function getAll() {
        return [
            'departments' => $this->getDepartments(),
            'researchTypes' => $this->getResearchTypes(),
            'categories' => $this->getCategories()
        ];
    }
}
