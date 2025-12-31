<?php

require_once __DIR__ . '/../models/RepositoryModel.php';
require_once __DIR__ . '/../models/AnnouncementModel.php';

class GeneralController {
    private $repositoryModel;
    private $announcementModel;
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
        $this->repositoryModel = new RepositoryModel($db);
        $this->announcementModel = new AnnouncementModel($db);
    }

    public function getRepositories($filters, $userId) {
        $repositories = $this->repositoryModel->getPublished($filters, $userId);
        return json_encode(["status" => "success", "data" => $repositories]);
    }

    public function getRepository($repositoryId) {
        $repository = $this->repositoryModel->getById($repositoryId, true);
        if ($repository) {
            return json_encode(["status" => "success", "data" => $repository]);
        }
        return json_encode(["status" => "error", "message" => "Repository not found or not published"]);
    }

    public function getPublishedAnnouncements() {
        $announcements = $this->announcementModel->getAll(true);
        return json_encode(["status" => "success", "data" => $announcements]);
    }
}
