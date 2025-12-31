-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 09, 2025 at 07:41 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `repository-api`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_category`
--

CREATE TABLE `tbl_category` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_category`
--

INSERT INTO `tbl_category` (`id`, `name`, `description`, `created_at`, `updated_at`, `is_active`) VALUES
(1, 'Artificial Intelligence', 'AI and machine learning research', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1),
(2, 'Machine Learning', 'Machine learning algorithms and applications', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1),
(3, 'Biotechnology', 'Biotechnology and life sciences', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1),
(4, 'Nanotechnology', 'Nanotechnology and materials science', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1),
(5, 'Quantum Computing', 'Quantum computing and quantum physics', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1),
(6, 'Climate Science', 'Climate and environmental science', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_department`
--

CREATE TABLE `tbl_department` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_department`
--

INSERT INTO `tbl_department` (`id`, `name`, `description`, `created_at`, `updated_at`, `is_active`) VALUES
(1, 'Computer Science', 'Computer Science and Information Technology', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1),
(2, 'Engineering', 'Engineering disciplines', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1),
(3, 'Biology', 'Biological Sciences', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1),
(4, 'Chemistry', 'Chemical Sciences', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1),
(5, 'Physics', 'Physical Sciences', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1),
(6, 'Mathematics', 'Mathematical Sciences', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_repository`
--

CREATE TABLE `tbl_repository` (
  `id` int(11) NOT NULL,
  `title` varchar(500) NOT NULL,
  `abstract` text NOT NULL,
  `publisher` int(11) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `tags` varchar(500) DEFAULT NULL,
  `publishedDate` date DEFAULT NULL,
  `publishedStatus` enum('pending','published','rejected','unpublished') NOT NULL DEFAULT 'pending',
  `pdfUrl` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_repository`
--

INSERT INTO `tbl_repository` (`id`, `title`, `abstract`, `publisher`, `category`, `tags`, `publishedDate`, `publishedStatus`, `pdfUrl`, `created_at`, `updated_at`) VALUES
(9, 'sdfsdf', 'sdfsdfsd', 1, 'Machine Learning, Engineering', 'asd, iop4', NULL, 'published', '/uploads/repository/repo_6910231d23c4a4.76456433_1762665245.pdf', '2025-11-09 05:14:05', '2025-11-09 05:14:05'),
(10, 'fsdfsdfsdf', 'sdfsdfsd', 1, 'Artificial Intelligence, Engineering', 'fsdfsdfsdf', NULL, 'published', '/uploads/repository/Learners Ville Childhood Monitoring System.pdf', '2025-11-09 05:16:25', '2025-11-09 05:16:25'),
(11, 'sdfsd', 'fsdfsd', 1, 'Machine Learning, Engineering', 'sdfsdfsd', NULL, 'published', '/uploads/repository/Learners Ville Childhood Monitoring System_1.pdf', '2025-11-09 05:20:11', '2025-11-09 05:20:11'),
(12, 'sdfsdf', 'sdfsdf', 1, 'Artificial Intelligence, Engineering', 'sdfsfsdfsd', NULL, 'published', '/uploads/repository/Learners Ville Childhood Monitoring System.pdf', '2025-11-09 05:22:27', '2025-11-09 05:22:27'),
(13, 'sdfsd', 'fsdfsdf', 1, 'Artificial Intelligence, Engineering', 'asdasdf', NULL, 'published', '/uploads/repository/Learners Ville Childhood Monitoring System_1.pdf', '2025-11-09 05:25:26', '2025-11-09 05:25:26'),
(14, 'sdfsdf', 'sdfsdf', 1, 'Engineering, Nanotechnology', 'sdfsdfsd\\', NULL, 'published', '/uploads/repository/Learners Ville Childhood Monitoring System_2.pdf', '2025-11-09 05:30:09', '2025-11-09 05:30:09'),
(15, 'SDFG', 'DFG', 1, 'Artificial Intelligence, Engineering, Machine Learning', 'DFGDF', NULL, 'published', '/uploads/repository/Learners Ville Childhood Monitoring System_3.pdf', '2025-11-09 05:34:16', '2025-11-09 05:34:16'),
(16, 'sdf', 'sdf', 1, 'Artificial Intelligence, Engineering', 'sdfsd', NULL, 'published', '/uploads/repository/Learners Ville Childhood Monitoring System_4.pdf', '2025-11-09 05:46:30', '2025-11-09 05:46:30'),
(17, 'sdg', 'dfgdf', 1, 'Engineering, Quantum Computing', 'dfgdfg', NULL, 'published', '/uploads/repository/Learners Ville Childhood Monitoring System_5.pdf', '2025-11-09 05:49:38', '2025-11-09 05:49:38'),
(18, 'sdfsdfsd', 'sdfsdfsdf', 1, 'Nanotechnology, Climate Science', 'sdfsdf', NULL, 'published', '/uploads/repository/Learners Ville Childhood Monitoring System_6.pdf', '2025-11-09 05:58:04', '2025-11-09 05:58:04'),
(19, 'New Learners VIlle System', 'This is the sample abstract section', 1, 'Biotechnology, Machine Learning', 'Test tr', NULL, 'published', '/uploads/repository/Learners Ville Childhood Monitoring System_7.pdf', '2025-11-09 06:00:07', '2025-11-09 06:00:07'),
(20, 'dddd', 'dddd', 1, 'Artificial Intelligence, Nanotechnology', 'dsd', NULL, 'published', '/uploads/repository/Deep Learning for Medical Image Analysis_ A Comprehensive Survey (1).pdf', '2025-11-09 06:03:42', '2025-11-09 06:03:42');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_research_type`
--

CREATE TABLE `tbl_research_type` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tbl_research_type`
--

INSERT INTO `tbl_research_type` (`id`, `name`, `description`, `created_at`, `updated_at`, `is_active`) VALUES
(1, 'Peer-Reviewed', 'Peer-reviewed research papers', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1),
(2, 'White Paper', 'White papers and technical documents', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1),
(3, 'Case Study', 'Case studies and analysis', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1),
(4, 'Technical Report', 'Technical reports and documentation', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1),
(5, 'Survey', 'Survey and research studies', '2025-11-09 06:25:32', '2025-11-09 06:25:32', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_users`
--

CREATE TABLE `tbl_users` (
  `user_id` int(11) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `user_pwd` varchar(255) NOT NULL,
  `user_school` varchar(255) DEFAULT NULL,
  `user_department` varchar(255) DEFAULT NULL,
  `user_role` varchar(50) NOT NULL DEFAULT 'publisher',
  `user_type` varchar(100) DEFAULT NULL,
  `user_contact` varchar(50) DEFAULT NULL,
  `user_address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_users`
--

INSERT INTO `tbl_users` (`user_id`, `user_name`, `user_email`, `user_pwd`, `user_school`, `user_department`, `user_role`, `user_type`, `user_contact`, `user_address`, `created_at`, `updated_at`) VALUES
(1, 'James Maritez', 'jamesmaritez@gmail.com', '$2y$10$Ryvjw/eJFEXOipmnZf7uW.ii7fQ9f81p.4c8eA6hyXyOh20FO16Na', 'PHINMA College', 'BSIT', 'publisher', 'Student', '09090909090', 'Cagayan de Oro City', '2025-11-07 16:06:42', '2025-11-09 05:59:23'),
(3, 'Alex Larosa', 'alex.admin@gmail.com', '$2y$10$dufjDfXXVYz4rtvq.9HxVOqqC20gyAUKYsALWfgb.75Be3eNAdD5.', 'PHINMA Cagayan de oro College', 'Bachelors of Science in Information Technology', 'admin', 'Faculty', '+63 0900 909 009', 'Cagayan de Oro City, Cagayan de Oro City, Misamis Oriental 9000, Philippines', '2025-11-09 06:37:28', '2025-11-09 06:38:08');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_category`
--
ALTER TABLE `tbl_category`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indexes for table `tbl_department`
--
ALTER TABLE `tbl_department`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indexes for table `tbl_repository`
--
ALTER TABLE `tbl_repository`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_repository_publisher` (`publisher`),
  ADD KEY `idx_repository_status` (`publishedStatus`),
  ADD KEY `idx_repository_category` (`category`),
  ADD KEY `idx_repository_published_date` (`publishedDate`);

--
-- Indexes for table `tbl_research_type`
--
ALTER TABLE `tbl_research_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indexes for table `tbl_users`
--
ALTER TABLE `tbl_users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `user_email` (`user_email`),
  ADD KEY `idx_user_email` (`user_email`),
  ADD KEY `idx_user_role` (`user_role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_category`
--
ALTER TABLE `tbl_category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `tbl_department`
--
ALTER TABLE `tbl_department`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `tbl_repository`
--
ALTER TABLE `tbl_repository`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `tbl_research_type`
--
ALTER TABLE `tbl_research_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `tbl_users`
--
ALTER TABLE `tbl_users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_repository`
--
ALTER TABLE `tbl_repository`
  ADD CONSTRAINT `fk_repository_publisher` FOREIGN KEY (`publisher`) REFERENCES `tbl_users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
