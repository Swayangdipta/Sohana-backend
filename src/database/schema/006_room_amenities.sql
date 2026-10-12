-- Table: room_amenities
-- Purpose: stores specific amenities available in a hotel room
CREATE TABLE IF NOT EXISTS `room_amenities` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `room_id` INT(11) NOT NULL,
  `amenity_name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ra_room` (`room_id`),
  CONSTRAINT `fk_ra_room` FOREIGN KEY (`room_id`) REFERENCES `hotel_rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
