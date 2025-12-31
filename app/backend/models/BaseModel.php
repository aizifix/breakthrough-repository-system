<?php

class BaseModel {
    protected $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    protected function formatCategories($category) {
        return !empty($category) ? explode(', ', $category) : [];
    }

    protected function formatTags($tags) {
        return !empty($tags) ? explode(', ', $tags) : [];
    }

    protected function formatDate($date, $createdAt) {
        if (empty($date) || $date === '0000-00-00' || $date === '1970-01-01') {
            return date('Y-m-d', strtotime($createdAt));
        }
        return $date;
    }
}
