/**
 * Email/SMTP configuration.
 * Used for sending transactional emails (e.g., booking confirmations, password resets).
 */
module.exports = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  from: process.env.SMTP_FROM || 'noreply@hotelbooking.com'
};
