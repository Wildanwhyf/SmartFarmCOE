-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 21, 2026 at 06:13 AM
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
-- Database: `smartfarm`
--

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `created_at`) VALUES
(1, 'admin', '2026-09-08 13:48:14'),
(2, 'farmer', '2026-09-08 13:48:14'),
(3, 'guest', '2026-09-08 13:48:14');

-- --------------------------------------------------------

--
-- Table structure for table `sensor_readings`
--

CREATE TABLE `sensor_readings` (
  `id` bigint(20) NOT NULL,
  `reading_time` datetime NOT NULL,
  `kelembapan_tanah` decimal(5,2) DEFAULT NULL,
  `suhu` decimal(5,2) DEFAULT NULL,
  `tekanan` decimal(7,2) DEFAULT NULL,
  `humidity` decimal(5,2) DEFAULT NULL,
  `nitrogen` decimal(6,2) DEFAULT NULL,
  `phosphorus` decimal(6,2) DEFAULT NULL,
  `potassium` decimal(6,2) DEFAULT NULL,
  `rssi` smallint(6) DEFAULT NULL,
  `snr` decimal(4,1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sensor_readings`
--

INSERT INTO `sensor_readings` (`id`, `reading_time`, `kelembapan_tanah`, `suhu`, `tekanan`, `humidity`, `nitrogen`, `phosphorus`, `potassium`, `rssi`, `snr`, `created_at`) VALUES
(1, '2026-09-09 03:14:00', 68.50, 27.30, 1013.25, 68.50, 45.00, 28.00, 110.00, -60, 4.4, '2026-09-08 13:56:10'),
(2, '2026-09-09 03:14:00', 29.00, 27.30, 1013.25, 68.50, 45.00, 28.00, 110.00, -60, 4.4, '2026-09-08 13:57:46'),
(3, '2026-09-14 21:36:00', 29.10, 19.50, 905.00, 80.50, 50.00, 30.00, 120.00, -50, 6.0, '2026-09-14 14:43:18'),
(4, '2026-09-14 21:36:00', NULL, 30.00, 930.00, 85.50, NULL, NULL, NULL, -70, 9.0, '2026-09-17 07:38:38'),
(5, '2026-09-17 14:54:00', NULL, 35.00, 950.00, 84.00, NULL, NULL, NULL, -75, 7.0, '2026-09-17 07:54:15'),
(6, '2026-09-17 14:54:00', NULL, 25.00, 950.00, 84.00, NULL, NULL, NULL, -75, 7.0, '2026-09-17 07:54:30');

-- --------------------------------------------------------

--
-- Table structure for table `threshold_settings`
--

CREATE TABLE `threshold_settings` (
  `id` int(11) NOT NULL,
  `parameter_name` varchar(50) NOT NULL,
  `min_value` decimal(8,2) DEFAULT NULL,
  `max_value` decimal(8,2) DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT 1,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `threshold_settings`
--

INSERT INTO `threshold_settings` (`id`, `parameter_name`, `min_value`, `max_value`, `is_enabled`, `updated_by`, `updated_at`) VALUES
(1, 'kelembapan_tanah', 30.00, 80.00, 1, 1, '2026-09-18 03:15:16'),
(2, 'suhu', 20.00, 32.50, 1, 1, '2026-09-17 07:19:36'),
(3, 'tekanan', 900.00, 1100.00, 1, 1, '2026-09-17 07:19:36'),
(4, 'humidity', 30.00, 90.00, 1, 1, '2026-09-17 07:19:36'),
(5, 'nitrogen', 20.00, 100.00, 1, 1, '2026-09-18 03:15:15'),
(6, 'phosphorus', 15.00, 80.00, 1, 1, '2026-09-18 03:15:15'),
(7, 'potassium', 50.00, 200.00, 1, 1, '2026-09-18 03:15:14');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL DEFAULT 2,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role_id`, `username`, `email`, `password_hash`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'admin', 'admin@example.com', '$2a$12$S7ph44ANnI6JDaic8r1atusEzS2KQ6k5s.6Jl9NmxVYnMisFnoRpK', 1, '2026-09-12 10:28:45', '2026-09-12 10:35:55'),
(2, 2, 'farmer', 'farmer@example.com', '$2b$10$8F39uebxtU/.hBQyT7YH.O9rzNidgohSKDj2RAM9VNXPz6uiaG2zW', 1, '2026-09-12 10:43:52', '2026-09-12 10:43:52'),
(3, 2, 'farmerbudi', 'budi@gmail.com', '$2b$10$PyR05ZsVW2juDv5yA8w0o.Xomb7iHSOMywfPQFvH8mkGtkrJGOztm', 1, '2026-09-14 15:00:35', '2026-09-14 15:00:35');

-- --------------------------------------------------------

--
-- Table structure for table `warnings`
--

CREATE TABLE `warnings` (
  `id` bigint(20) NOT NULL,
  `sensor_reading_id` bigint(20) NOT NULL,
  `parameter_name` varchar(50) NOT NULL,
  `triggered_value` decimal(8,2) NOT NULL,
  `threshold_min` decimal(8,2) DEFAULT NULL,
  `threshold_max` decimal(8,2) DEFAULT NULL,
  `message` varchar(255) NOT NULL,
  `is_resolved` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_acknowledged` tinyint(1) DEFAULT 0,
  `acknowledged_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `warnings`
--

INSERT INTO `warnings` (`id`, `sensor_reading_id`, `parameter_name`, `triggered_value`, `threshold_min`, `threshold_max`, `message`, `is_resolved`, `created_at`, `is_acknowledged`, `acknowledged_by`) VALUES
(1, 3, 'kelembapan', 29.10, 30.00, 80.00, 'kelembapan is too low: 29.1 (min threshold: 30)', 0, '2026-09-14 14:43:18', 1, 1),
(2, 3, 'suhu', 19.50, 20.00, 32.50, 'suhu is too low: 19.5 (min threshold: 20)', 0, '2026-09-14 14:43:18', 1, 1),
(3, 5, 'suhu', 35.00, 20.00, 32.50, 'suhu is too high: 35 (max threshold: 32.5)', 0, '2026-09-17 07:54:15', 1, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `sensor_readings`
--
ALTER TABLE `sensor_readings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reading_time` (`reading_time`);

--
-- Indexes for table `threshold_settings`
--
ALTER TABLE `threshold_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `parameter_name` (`parameter_name`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `warnings`
--
ALTER TABLE `warnings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sensor_reading_id` (`sensor_reading_id`),
  ADD KEY `idx_warnings_created` (`created_at`),
  ADD KEY `acknowledged_by` (`acknowledged_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `sensor_readings`
--
ALTER TABLE `sensor_readings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `threshold_settings`
--
ALTER TABLE `threshold_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `warnings`
--
ALTER TABLE `warnings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `threshold_settings`
--
ALTER TABLE `threshold_settings`
  ADD CONSTRAINT `threshold_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Constraints for table `warnings`
--
ALTER TABLE `warnings`
  ADD CONSTRAINT `warnings_ibfk_1` FOREIGN KEY (`sensor_reading_id`) REFERENCES `sensor_readings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `warnings_ibfk_2` FOREIGN KEY (`acknowledged_by`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
