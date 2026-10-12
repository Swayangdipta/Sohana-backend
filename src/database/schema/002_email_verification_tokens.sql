-- Table: email_verification_tokens
-- Purpose: stores hashed email verification tokens
-- Flow: register → generate token → hash it → store hash → email raw token to user → user clicks link → we hash the submitted token and look up the hash
-- We store hashes (not raw tokens) so a DB breach doesn't expose usable tokens
CREATE TABLE IF NOT EXISTS `email_verification_tokens` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,  -- SHA-256 hash of the actual token
  `expires_at` TIMESTAMP NOT NULL,  -- token validity window (24 hours from creation)
  `used_at` TIMESTAMP NULL DEFAULT NULL,  -- set when token is consumed, prevents reuse
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_evt_token_hash` (`token_hash`),  -- fast lookup when verifying
  KEY `idx_evt_user_unused` (`user_id`, `used_at`),  -- find active tokens for a user
  CONSTRAINT `fk_evt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
