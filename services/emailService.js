import { saveVerificationCode, validateVerificationCode, getTenantInvitationByEmail } from './database';

const MOCK_MODE = true;
let lastGeneratedCode = null;

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationCode(email) {
  const code = generateCode();
  lastGeneratedCode = code;
  await saveVerificationCode(email, code);

  if (MOCK_MODE) {
    console.log(`[MOCK EMAIL] Verification code for ${email}: ${code}`);
    return { success: true, message: 'Verification code sent (mock mode)', mockCode: code };
  }

  return { success: true, message: 'Verification code sent to your email' };
}

export async function verifyCode(email, code) {
  const result = await validateVerificationCode(email, code);
  return {
    success: result.success,
    message: result.message,
    status: result.status || (result.success ? 'valid' : 'invalid'),
  };
}

export function getLastMockCode() {
  return lastGeneratedCode;
}

// ============ TENANT ACCESS CODE EMAIL ============

// Called by landlord (rooms.js) when assigning a room to a tenant email
export async function sendTenantAccessCode(tenantEmail, roomId, accessCode) {
  if (MOCK_MODE) {
    console.log(`[MOCK EMAIL] Tenant access code for ${tenantEmail} | Room: ${roomId} | Code: ${accessCode}`);
    return {
      success: true,
      message: `Access code sent to ${tenantEmail} (mock mode)`,
      mockCode: accessCode,
    };
  }

  // Real email API call goes here
  return { success: true, message: `Access code sent to ${tenantEmail}` };
}

// Called by tenant (register.js) — looks up their invitation and re-sends the code
export async function requestTenantAccessCode(email) {
  const invitation = await getTenantInvitationByEmail(email);

  if (!invitation) {
    return {
      success: false,
      message: 'No access code found for this email. Please ask your landlord to send you one first.',
    };
  }

  if (MOCK_MODE) {
    console.log(`[MOCK EMAIL] Re-sent tenant code to ${email}: ${invitation.tenant_code} (Room: ${invitation.room_id})`);
    return {
      success: true,
      message: `Access code sent to ${email}`,
      mockCode: invitation.tenant_code,
      roomId: invitation.room_id,
    };
  }

  // Real email API call goes here
  return { success: true, message: `Access code sent to ${email}` };
}