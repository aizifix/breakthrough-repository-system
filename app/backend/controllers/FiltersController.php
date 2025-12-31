<?php

require_once __DIR__ . '/../models/FilterModel.php';

class FiltersController {
    private $filterModel;

    public function __construct($db) {
        $this->filterModel = new FilterModel($db);
    }

    public function getDepartments() {
        $departments = $this->filterModel->getDepartments();
        return json_encode(["status" => "success", "data" => $departments]);
    }

    public function getResearchTypes() {
        $researchTypes = $this->filterModel->getResearchTypes();
        return json_encode(["status" => "success", "data" => $researchTypes]);
    }

    public function getCategories() {
        $categories = $this->filterModel->getCategories();
        return json_encode(["status" => "success", "data" => $categories]);
    }

    public function getAllFilters() {
        $filters = $this->filterModel->getAll();
        return json_encode(["status" => "success", "data" => $filters]);
    }
}
