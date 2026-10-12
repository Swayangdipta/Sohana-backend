-- Table: hotel_amenities
-- Purpose: normalized amenities per hotel (replaces the comma-separated hotels.amenities TEXT field)
-- The old hotels.amenities column is kept for backward compatibility
-- New code should read from this table; old data remains in hotels.amenities
CREATE TABLE IF NOT EXISTS `hotel_amenities` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `hotel_id` INT(11) NOT NULL,
  `amenity_name` VARCHAR(100) NOT NULL,  -- e.g., 'Free WiFi', 'Swimming Pool'
  `amenity_icon` VARCHAR(100) DEFAULT NULL,  -- optional icon class/name for UI
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ha_hotel` (`hotel_id`),
  CONSTRAINT `fk_ha_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
