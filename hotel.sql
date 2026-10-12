-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 17, 2026 at 02:16 PM
-- Server version: 10.11.14-MariaDB-0ubuntu0.24.04.1
-- PHP Version: 8.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hotel`
--

-- --------------------------------------------------------

--
-- Table structure for table `cities`
--

CREATE TABLE `cities` (
  `id` int(11) NOT NULL,
  `state_id` int(11) NOT NULL,
  `city_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cities`
--

INSERT INTO `cities` (`id`, `state_id`, `city_name`) VALUES
(2, 2, 'Kolkata'),
(6, 2, 'TARAPITH'),
(9, 2, 'Tarapith');

-- --------------------------------------------------------

--
-- Table structure for table `hotels`
--

CREATE TABLE `hotels` (
  `id` int(11) NOT NULL,
  `state_id` int(11) NOT NULL,
  `city_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `hotel_name` varchar(255) NOT NULL,
  `contact_number` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `google_map_link` text DEFAULT NULL,
  `parking_map_link` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `amenities` text DEFAULT NULL,
  `featured_image` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hotels`
--

INSERT INTO `hotels` (`id`, `state_id`, `city_id`, `location_id`, `hotel_name`, `contact_number`, `email`, `address`, `google_map_link`, `parking_map_link`, `description`, `amenities`, `featured_image`, `status`, `created_at`) VALUES
(2, 2, 2, 2, 'sohana internATIONAL Hotel Kolkata', '7029094661', 'rOFIKULSTORES135@GMAIL.COM', 'KOLKATA', '', '', 'Five star', 'Free WiFi, Swimming Pool, Air Conditioning, Restaurant, Parking, Room Service, Power Backup, Bar', 'hotel_main_1786522140_6774.jpg', 1, '2026-08-12 08:09:00'),
(3, 2, 2, 2, 'Sohana International Hotel Kolkata', '7029094661', 'sohana@gmail.com', 'Indus Tourism, 61/2, Swami Vivekananda Road, Shibpur,', '', '', 'Distance from mandir is 300 mtr. Bus stand is 500 mtr away. All kinds of transportations are available.', 'Free WiFi, Swimming Pool, Air Conditioning, Restaurant, Parking, Room Service, Power Backup', 'hotel_main_1786523620_2750.jpg', 1, '2026-08-12 08:33:40');

-- --------------------------------------------------------

--
-- Table structure for table `hotel_images`
--

CREATE TABLE `hotel_images` (
  `id` int(11) NOT NULL,
  `hotel_id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hotel_rooms`
--

CREATE TABLE `hotel_rooms` (
  `id` int(11) NOT NULL,
  `hotel_id` int(11) NOT NULL,
  `room_type` varchar(100) NOT NULL,
  `price_per_night` decimal(10,2) NOT NULL DEFAULT 0.00,
  `capacity` int(11) NOT NULL DEFAULT 2,
  `total_rooms` int(11) NOT NULL DEFAULT 1,
  `status` tinyint(1) DEFAULT 1,
  `room_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hotel_rooms`
--

INSERT INTO `hotel_rooms` (`id`, `hotel_id`, `room_type`, `price_per_night`, `capacity`, `total_rooms`, `status`, `room_image`) VALUES
(5, 2, 'AC', 3000.00, 2, 5, 1, ''),
(6, 3, 'Deluxe Room', 2000.00, 2, 5, 1, ''),
(7, 3, 'Super Deluxe', 3000.00, 2, 4, 1, '');

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `id` int(11) NOT NULL,
  `state_id` int(11) NOT NULL,
  `city_id` int(11) NOT NULL,
  `location_name` varchar(150) NOT NULL,
  `pincode` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`id`, `state_id`, `city_id`, `location_name`, `pincode`) VALUES
(2, 2, 2, 'New Town', '7000016'),
(4, 2, 6, 'MUNDA MALINI TALA', '731233'),
(8, 2, 6, 'Sagar More', '731233');

-- --------------------------------------------------------

--
-- Table structure for table `states`
--

CREATE TABLE `states` (
  `id` int(11) NOT NULL,
  `state_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `states`
--

INSERT INTO `states` (`id`, `state_name`) VALUES
(2, 'WEST BENGAL');

-- --------------------------------------------------------

--
-- Table structure for table `store_application`
--

CREATE TABLE `store_application` (
  `id` int(11) NOT NULL,
  `application_no` varchar(50) DEFAULT NULL,
  `applicant_name` varchar(100) DEFAULT NULL,
  `store_name` varchar(150) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `password` varchar(30) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `store_type` varchar(50) DEFAULT NULL,
  `investment` varchar(50) DEFAULT NULL,
  `area_sqft` varchar(50) DEFAULT NULL,
  `aadhaar_file` varchar(255) DEFAULT NULL,
  `pan_file` varchar(255) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `store_application`
--

INSERT INTO `store_application` (`id`, `application_no`, `applicant_name`, `store_name`, `mobile`, `password`, `email`, `address`, `state`, `district`, `pincode`, `store_type`, `investment`, `area_sqft`, `aadhaar_file`, `pan_file`, `submitted_at`, `status`) VALUES
(1, 'STR202601210001', 'Sohana', 'Sohana', '8597105657', '8597105657', 'sohana@gmail.com', 'Kolkata', 'West Bengal', 'Kolkata', '722101', NULL, NULL, NULL, '', '', '2026-01-21 06:26:23', 'Approved');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cities`
--
ALTER TABLE `cities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `state_id` (`state_id`);

--
-- Indexes for table `hotels`
--
ALTER TABLE `hotels`
  ADD PRIMARY KEY (`id`),
  ADD KEY `state_id` (`state_id`),
  ADD KEY `city_id` (`city_id`),
  ADD KEY `location_id` (`location_id`);

--
-- Indexes for table `hotel_images`
--
ALTER TABLE `hotel_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hotel_id` (`hotel_id`);

--
-- Indexes for table `hotel_rooms`
--
ALTER TABLE `hotel_rooms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hotel_id` (`hotel_id`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `state_id` (`state_id`),
  ADD KEY `city_id` (`city_id`);

--
-- Indexes for table `states`
--
ALTER TABLE `states`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `state_name` (`state_name`);

--
-- Indexes for table `store_application`
--
ALTER TABLE `store_application`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cities`
--
ALTER TABLE `cities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `hotels`
--
ALTER TABLE `hotels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `hotel_images`
--
ALTER TABLE `hotel_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hotel_rooms`
--
ALTER TABLE `hotel_rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `states`
--
ALTER TABLE `states`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `store_application`
--
ALTER TABLE `store_application`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cities`
--
ALTER TABLE `cities`
  ADD CONSTRAINT `cities_ibfk_1` FOREIGN KEY (`state_id`) REFERENCES `states` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hotels`
--
ALTER TABLE `hotels`
  ADD CONSTRAINT `hotels_ibfk_1` FOREIGN KEY (`state_id`) REFERENCES `states` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hotels_ibfk_2` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hotels_ibfk_3` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hotel_images`
--
ALTER TABLE `hotel_images`
  ADD CONSTRAINT `hotel_images_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `hotel_rooms`
--
ALTER TABLE `hotel_rooms`
  ADD CONSTRAINT `hotel_rooms_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `locations`
--
ALTER TABLE `locations`
  ADD CONSTRAINT `locations_ibfk_1` FOREIGN KEY (`state_id`) REFERENCES `states` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `locations_ibfk_2` FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
