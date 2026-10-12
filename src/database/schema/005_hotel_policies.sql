-- Table: hotel_policies
-- Purpose: stores different types of policies for each hotel (check-in, check-out, cancellation, etc.)
CREATE TABLE IF NOT EXISTS `hotel_policies` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `hotel_id` INT(11) NOT NULL,
  `policy_type` ENUM('CHECK_IN','CHECK_OUT','CANCELLATION','PETS','SMOKING','PAYMENT','OTHER') NOT NULL,
  `policy_text` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hp_hotel_type` (`hotel_id`, `policy_type`),
  CONSTRAINT `fk_hp_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
