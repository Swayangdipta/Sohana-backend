/**
 * General application configuration.
 * Centralizes environment variables related to the app's basic operations.
 */
module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  env: process.env.NODE_ENV || 'development',
  url: process.env.APP_URL || 'http://localhost:3000',
  uploadDir: process.env.UPLOAD_DIR || 'uploads'
};
