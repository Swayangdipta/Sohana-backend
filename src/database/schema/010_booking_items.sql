-- Table: booking_items
-- Purpose: line items for each booking — preserves HISTORICAL pricing
-- CRITICAL: all price fields are snapshots from booking time
-- If room price changes later, these values remain unchanged
-- This ensures booking history is always accurate
CREATE TABLE IF NOT EXISTS `booking_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `booking_id` INT(11) NOT NULL,
  `room_id` INT(11) NOT NULL,
  `room_type_snapshot` VARCHAR(100) NOT NULL,  -- copied from hotel_rooms.room_type at booking time
  `rate_plan_snapshot` VARCHAR(100) DEFAULT NULL,  -- rate plan name if applicable
  `quantity` INT(11) NOT NULL DEFAULT 1,  -- number of rooms booked
  `price_per_night` DECIMAL(10,2) NOT NULL,  -- snapshot of price at booking time
  `num_nights` INT(11) NOT NULL,
  `discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `tax_percentage` DECIMAL(5,2) NOT NULL DEFAULT 12.00,  -- GST rate at booking time
  `tax_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,  -- calculated: (subtotal - discount) * tax_percentage / 100
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- final: subtotal - discount + tax_amount
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bi_booking` (`booking_id`),
  KEY `idx_bi_room` (`room_id`),
  CONSTRAINT `fk_bi_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bi_room` FOREIGN KEY (`room_id`) REFERENCES `hotel_rooms` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
