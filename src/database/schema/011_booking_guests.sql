-- Table: booking_guests
-- Purpose: stores guest details associated with a specific booking
CREATE TABLE IF NOT EXISTS `booking_guests` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `booking_id` INT(11) NOT NULL,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) DEFAULT NULL,
  `age` INT(11) DEFAULT NULL,
  `gender` ENUM('MALE','FEMALE','OTHER') DEFAULT NULL,
  `guest_type` ENUM('ADULT','CHILD') NOT NULL DEFAULT 'ADULT',
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,  -- 1 = primary guest / contact person
  `email` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bg_booking` (`booking_id`),
  CONSTRAINT `fk_bg_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
