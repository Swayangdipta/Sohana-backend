-- Table: password_reset_tokens
-- Purpose: stores hashed password reset tokens (same pattern as email verification)
-- Token expires in 1 hour for security
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `used_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_prt_token_hash` (`token_hash`),
  KEY `idx_prt_user_unused` (`user_id`, `used_at`),
  CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
