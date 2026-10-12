-- Table: room_availability
-- Purpose: tracks date-level room inventory and optional price overrides
-- CRITICAL for booking system: this is the source of truth for available rooms on any given date
-- The UNIQUE constraint on (room_id, date) is essential for atomic inventory updates
-- When no row exists for a date: fallback to hotel_rooms.total_rooms
-- When row exists: available_rooms is the current inventory
-- price_override: if set, overrides hotel_rooms.price_per_night for that date (dynamic/seasonal pricing)
CREATE TABLE IF NOT EXISTS `room_availability` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `room_id` INT(11) NOT NULL,
  `date` DATE NOT NULL,  -- the specific night this record represents
  `available_rooms` INT(11) NOT NULL,  -- current inventory for this night
  `price_override` DECIMAL(10,2) DEFAULT NULL,  -- NULL = use base price from hotel_rooms
  `status` TINYINT(1) NOT NULL DEFAULT 1,  -- 1=bookable, 0=blocked
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ra_room_date` (`room_id`, `date`),  -- one record per room per date, enables atomic updates
  KEY `idx_ra_date` (`date`),  -- speeds up date-range queries
  KEY `idx_ra_room_date_avail` (`room_id`, `date`, `available_rooms`),  -- composite for availability checks
  CONSTRAINT `fk_ravail_room` FOREIGN KEY (`room_id`) REFERENCES `hotel_rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
