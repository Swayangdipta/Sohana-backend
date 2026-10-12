-- Table: booking_cancellations
-- Purpose: records details about cancelled bookings
-- One cancellation record per booking (UNIQUE on booking_id)
-- cancelled_by uses SET NULL so we keep cancellation record even if user is deleted
CREATE TABLE IF NOT EXISTS `booking_cancellations` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `booking_id` INT(11) NOT NULL,
  `cancelled_by` INT(11) DEFAULT NULL,
  `cancellation_reason` TEXT DEFAULT NULL,
  `refund_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `cancellation_status` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'APPROVED',
  `cancelled_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bc_booking` (`booking_id`),
  KEY `idx_bc_cancelled_by` (`cancelled_by`),
  CONSTRAINT `fk_bc_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bc_user` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
