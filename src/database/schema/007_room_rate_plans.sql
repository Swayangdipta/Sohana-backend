-- Table: room_rate_plans
-- Purpose: allows multiple rate plans per room type (e.g., 'Room Only', 'With Breakfast')
-- Also supports seasonal pricing via valid_from/valid_to date ranges
CREATE TABLE IF NOT EXISTS `room_rate_plans` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `room_id` INT(11) NOT NULL,
  `plan_name` VARCHAR(100) NOT NULL,  -- e.g., 'Room Only', 'Breakfast Included'
  `plan_description` TEXT DEFAULT NULL,
  `base_price` DECIMAL(10,2) NOT NULL,  -- price per night for this plan
  `tax_percentage` DECIMAL(5,2) NOT NULL DEFAULT 12.00,
  `meal_plan` ENUM('NONE','BREAKFAST','HALF_BOARD','FULL_BOARD') NOT NULL DEFAULT 'NONE',
  `valid_from` DATE DEFAULT NULL,  -- NULL means always valid
  `valid_to` DATE DEFAULT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rrp_room` (`room_id`),
  KEY `idx_rrp_room_active` (`room_id`, `status`, `valid_from`, `valid_to`),
  CONSTRAINT `fk_rrp_room` FOREIGN KEY (`room_id`) REFERENCES `hotel_rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
