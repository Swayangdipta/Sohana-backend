-- Table: users
-- Purpose: stores all registered users (customers, admins, staff)
-- The users table is central to auth and booking systems
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `mobile` VARCHAR(20) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,  -- bcrypt hashed, never stored in plaintext
  `email_verified` TINYINT(1) NOT NULL DEFAULT 0,  -- 0=unverified, 1=verified. Must be 1 to login
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `mobile_verified` TINYINT(1) NOT NULL DEFAULT 0,  -- reserved for future WhatsApp/OTP verification
  `mobile_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `status` ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `role` ENUM('CUSTOMER','HOTEL_ADMIN','STAFF','SUPER_ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),  -- each email can register only once
  UNIQUE KEY `uk_users_mobile` (`mobile`),  -- each mobile can register only once (nullable)
  KEY `idx_users_status` (`status`),  -- speeds up filtering active users
  KEY `idx_users_role` (`role`)  -- speeds up role-based queries
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
