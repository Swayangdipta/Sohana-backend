/**
 * Email Service — handles all outbound emails for the platform.
 * 
 * Uses nodemailer with SMTP transport.
 * Templates are HTML files with {{placeholder}} syntax.
 * 
 * Design decisions:
 * - Templates are loaded from disk and cached for performance
 * - All template variables are replaced using a simple regex
 * - Email sending never throws to the caller (logs errors internally)
 *   This prevents email failures from breaking critical flows like booking
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const emailConfig = require('../../config/email');
const appConfig = require('../../config/app');

// Create reusable SMTP transporter
// Comment: transporter is created once and reused — nodemailer handles connection pooling
const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.port === '465' || emailConfig.port === 465,  // true for 465, false for other ports
  auth: {
    user: emailConfig.user,
    pass: emailConfig.password
  }
});

/**
 * Load and populate an HTML template with variables.
 * @param {string} templateName - filename without path (e.g., 'verification.html')
 * @param {Object} variables - key-value pairs to replace {{key}} in template
 * @returns {string} populated HTML string
 */
function loadTemplate(templateName, variables) {
  const templatePath = path.join(__dirname, '../../templates/emails', templateName);
  let html;
  try {
    html = fs.readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    return '';
  }
  
  // Replace all {{variable}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value || '');
  }
  
  return html;
}

/**
 * Send an email. Handles errors gracefully — logs but doesn't throw.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 */
async function sendEmail(to, subject, html) {
  try {
    if (!html) throw new Error('Email HTML content is empty');
    const mailOptions = {
      from: `"Hotel Booking" <${emailConfig.from}>`,
      to,
      subject,
      html
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    // Don't throw — email failure shouldn't break the caller's flow
    return null;
  }
}

/**
 * Send user registration verification email
 * @param {Object} user - User object
 * @param {string} rawToken - Unhashed token for URL
 */
async function sendVerificationEmail(user, rawToken) {
  const verificationLink = `${appConfig.url}/api/auth/verify-email?token=${rawToken}`;
  const html = loadTemplate('verification.html', {
    name: user.name,
    verificationLink,
    expiryHours: '24'
  });
  return sendEmail(user.email, 'Verify Your Email - Hotel Booking Platform', html);
}

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} rawToken - Unhashed token for URL
 */
async function sendPasswordResetEmail(user, rawToken) {
  const resetLink = `${appConfig.url}/api/auth/reset-password?token=${rawToken}`;
  const html = loadTemplate('passwordReset.html', {
    name: user.name,
    resetLink,
    expiryHours: '1'
  });
  return sendEmail(user.email, 'Reset Your Password - Hotel Booking Platform', html);
}

/**
 * Send booking confirmation email
 * @param {Object} user - User object
 * @param {Object} booking - Booking data
 */
async function sendBookingConfirmationEmail(user, booking) {
  const html = loadTemplate('bookingConfirmation.html', {
    name: user.name,
    bookingReference: booking.booking_reference,
    hotelName: booking.hotel_name,
    hotelAddress: booking.hotel_address || 'N/A',
    hotelContact: booking.hotel_contact || 'N/A',
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    numRooms: String(booking.num_rooms),
    numAdults: String(booking.num_adults),
    numChildren: String(booking.num_children),
    roomType: booking.room_type,
    pricePerNight: String(booking.price_per_night),
    numNights: String(booking.num_nights),
    subtotal: String(booking.subtotal),
    discount: String(booking.discount),
    taxRate: String(booking.tax_rate),
    taxAmount: String(booking.tax_amount),
    totalAmount: String(booking.total_amount),
    currency: booking.currency || 'INR',
    paymentMethod: 'Pay at Hotel',
    specialRequests: booking.special_requests || 'None',
    contactName: booking.contact_name,
    contactEmail: booking.contact_email,
    contactPhone: booking.contact_phone
  });
  return sendEmail(user.email, `Booking Confirmed - ${booking.booking_reference}`, html);
}

/**
 * Send booking cancellation email
 * @param {Object} user - User object
 * @param {Object} booking - Cancelled booking data
 */
async function sendBookingCancellationEmail(user, booking) {
  const html = loadTemplate('bookingCancellation.html', {
    name: user.name,
    bookingReference: booking.booking_reference,
    hotelName: booking.hotel_name,
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    totalAmount: String(booking.total_amount),
    currency: booking.currency || 'INR',
    cancellationReason: booking.cancellation_reason || 'No reason provided',
    refundAmount: '0',
    paymentMethod: 'Pay at Hotel'
  });
  return sendEmail(user.email, `Booking Cancelled - ${booking.booking_reference}`, html);
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail
};
