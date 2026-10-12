/**
 * JWT (JSON Web Token) configuration.
 * Defines the secret used for signing tokens and their expiration duration.
 */
module.exports = {
  // Secret key used to sign and verify JWT tokens.
  secret: process.env.JWT_SECRET || 'fallback-secret-key-do-not-use-in-production',
  // Expiry strategy: Tokens expire after a specified duration (e.g., '7d', '24h').
  // Short-lived tokens are more secure but require frequent re-authentication.
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};
