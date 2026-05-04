<?php
/**
 * Email API Configuration for Wattipid
 * 
 * This file manages Email API credentials.
 * Supported providers: SendGrid, Mailgun, Brevo (Sendinblue)
 * 
 * SECURITY: Never commit real API keys to version control.
 *           Use environment variables or a .env file in production.
 */

// ============ EMAIL PROVIDER SELECTION ============
// Options: 'sendgrid', 'brevo', 'mock'
define('EMAIL_PROVIDER', 'brevo');

// ============ SENDGRID CONFIGURATION ============
// Sign up at https://sendgrid.com (100 emails/day free tier)
define('SENDGRID_API_KEY', 'YOUR_SENDGRID_API_KEY_HERE');

// ============ BREVO (Sendinblue) CONFIGURATION ============
// Sign up at https://www.brevo.com (300 emails/day free tier — recommended)
define('BREVO_API_KEY', 'YOUR_SENDGRID_API_KEY_HERE');

// ============ SENDER CONFIGURATION ============
// This MUST be a verified sender in your email provider dashboard
define('SENDER_EMAIL', 'wattipid.noreply@gmail.com');
define('SENDER_NAME', 'Wattipid Energy Monitor');

// ============ OTP SETTINGS ============
define('OTP_LENGTH', 6);
define('OTP_EXPIRY_MINUTES', 5);
define('OTP_MAX_ATTEMPTS', 5);           // Max failed verification attempts
define('OTP_RESEND_COOLDOWN_SECONDS', 60); // Minimum wait between resends
define('OTP_RATE_LIMIT_PER_HOUR', 10);   // Max OTPs per email per hour
