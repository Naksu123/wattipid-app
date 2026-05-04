import { 
  sendVerificationCodeAPI, 
  verifyOTPAPI, 
  resendVerificationCodeAPI, 
  getTenantInvitationByEmail 
} from './database';

// ============ EMAIL VERIFICATION ============

/**
 * Send a verification code to the user's email.
 * This now calls the real backend API which dispatches via SendGrid/Brevo.
 */
export async function sendVerificationCode(email, name = '') {
  const result = await sendVerificationCodeAPI(email, name);
  return {
    success: result.success,
    message: result.message,
    mockCode: result.mockCode || null,  // Only present in mock/dev mode
  };
}

/**
 * Verify a code entered by the user against the backend.
 */
export async function verifyCode(email, code) {
  const result = await verifyOTPAPI(email, code, 'verification');
  return {
    success: result.success,
    message: result.message,
    status: result.status || (result.success ? 'valid' : 'invalid'),
  };
}

/**
 * Resend a verification code.
 * The backend handles rate limiting and invalidating old codes.
 */
export async function resendCode(email, name = '') {
  const result = await resendVerificationCodeAPI(email, name);
  return {
    success: result.success,
    message: result.message,
    mockCode: result.mockCode || null,
  };
}

export function getLastMockCode() {
  return null; // No longer applicable with real emails
}


// ============ TENANT ACCESS CODE EMAIL ============

/**
 * Called by landlord (rooms.js) when assigning a room to a tenant email.
 * The actual email is now sent by the backend when saveTenantInvitation is called.
 * This function is kept for backward compatibility but the email sending
 * is now handled server-side in api.php -> sendAccessCodeEmail().
 */
export async function sendTenantAccessCode(tenantEmail, roomId, accessCode) {
  // The backend now handles email sending when saveTenantInvitation is called.
  // This function just returns success since the invitation was already saved.
  return {
    success: true,
    message: `Access code sent to ${tenantEmail}`,
    mockCode: accessCode,  // Keep for UI display in landlord success modal
  };
}

/**
 * Called by tenant (register.js) — looks up their invitation.
 * The actual verification email was already sent by the landlord's action.
 */
export async function requestTenantAccessCode(email) {
  const result = await getTenantInvitationByEmail(email);
  const invitation = (result && result.success) ? result : null;

  if (!invitation) {
    return {
      success: false,
      expired: result?.expired || false,
      message: result?.message || 'No access code found for this email. Please ask your landlord to send you one first.',
    };
  }

  return {
    success: true,
    message: `Access code found for ${email}`,
    mockCode: invitation.tenant_code,
    roomId: invitation.room_id,
  };
}