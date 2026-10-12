-- Table: bookings
-- Purpose: master booking record — one row per reservation
-- booking_reference is the human-friendly ID shown to customers (e.g., HTL-20260918-ABC123)
-- booking_status and payment_status are deliberately SEPARATE — a booking can be CONFIRMED with payment PAY_AT_HOTEL
-- ON DELETE RESTRICT on user_id and hotel_id: we never want to lose booking history
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `booking_reference` VARCHAR(30) NOT NULL,
  `user_id` INT(11) NOT NULL,
  `hotel_id` INT(11) NOT NULL,
  `check_in` DATE NOT NULL,
  `check_out` DATE NOT NULL,
  `num_rooms` INT(11) NOT NULL DEFAULT 1,
  `num_adults` INT(11) NOT NULL DEFAULT 1,
  `num_children` INT(11) NOT NULL DEFAULT 0,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'INR',
  `booking_status` ENUM('PENDING','CONFIRMED','CANCELLED','COMPLETED','FAILED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  `payment_status` ENUM('PENDING','PAY_AT_HOTEL','PAID','REFUNDED','PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING',
  `payment_method` ENUM('PAY_AT_HOTEL','ONLINE','UPI','CARD','NET_BANKING') NOT NULL DEFAULT 'PAY_AT_HOTEL',
  `contact_name` VARCHAR(100) NOT NULL,
  `contact_email` VARCHAR(100) NOT NULL,
  `contact_phone` VARCHAR(20) NOT NULL,
  `special_requests` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bookings_reference` (`booking_reference`),
  KEY `idx_bookings_user` (`user_id`),
  KEY `idx_bookings_hotel` (`hotel_id`),
  KEY `idx_bookings_status` (`booking_status`),
  KEY `idx_bookings_payment` (`payment_status`),
  KEY `idx_bookings_hotel_dates` (`hotel_id`, `check_in`, `check_out`),
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
