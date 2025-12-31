<?php

require_once __DIR__ . '/../models/NotificationModel.php';

class NotificationsController {
    private $notificationModel;

    public function __construct($db) {
        $this->notificationModel = new NotificationModel($db);
    }

    public function getNotifications($userId, $unreadOnly) {
        $notifications = $this->notificationModel->getByUser($userId, $unreadOnly);
        return json_encode(["status" => "success", "data" => $notifications]);
    }

    public function getUnreadCount($userId) {
        $count = $this->notificationModel->getUnreadCount($userId);
        return json_encode(["status" => "success", "count" => $count]);
    }

    public function markAsRead($notificationId, $userId) {
        $result = $this->notificationModel->markAsRead($notificationId, $userId);
        return json_encode($result + ["message" => "Notification marked as read"]);
    }

    public function markAllAsRead($userId) {
        $result = $this->notificationModel->markAllAsRead($userId);
        return json_encode($result + ["message" => "All notifications marked as read"]);
    }
}
