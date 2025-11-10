-- Migration: Add social features tables (ratings, likes, comments)
-- Run this SQL to add social interaction features

-- Table for repository ratings (1-5 stars)
CREATE TABLE IF NOT EXISTS `tbl_repository_ratings` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `repository_id` INT(11) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `rating` TINYINT(1) NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_repository_rating` (`repository_id`, `user_id`),
  KEY `idx_repository_ratings_repo` (`repository_id`),
  KEY `idx_repository_ratings_user` (`user_id`),
  CONSTRAINT `fk_ratings_repository` FOREIGN KEY (`repository_id`) REFERENCES `tbl_repository` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ratings_user` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for repository likes
CREATE TABLE IF NOT EXISTS `tbl_repository_likes` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `repository_id` INT(11) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_repository_like` (`repository_id`, `user_id`),
  KEY `idx_repository_likes_repo` (`repository_id`),
  KEY `idx_repository_likes_user` (`user_id`),
  CONSTRAINT `fk_likes_repository` FOREIGN KEY (`repository_id`) REFERENCES `tbl_repository` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_likes_user` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for repository comments
CREATE TABLE IF NOT EXISTS `tbl_repository_comments` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `repository_id` INT(11) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `comment` TEXT NOT NULL,
  `parent_comment_id` INT(11) NULL DEFAULT NULL COMMENT 'For nested/reply comments',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_repository_comments_repo` (`repository_id`),
  KEY `idx_repository_comments_user` (`user_id`),
  KEY `idx_repository_comments_parent` (`parent_comment_id`),
  CONSTRAINT `fk_comments_repository` FOREIGN KEY (`repository_id`) REFERENCES `tbl_repository` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_parent` FOREIGN KEY (`parent_comment_id`) REFERENCES `tbl_repository_comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
