import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from './config';
import ErrorTracker from './errorTracker';

let abortController = new AbortController();

/**
 * Cancel all currently pending API requests.
 * Only used during logout to clear background tasks.
 */
export function cancelAllRequests() {
  const oldController = abortController;
  abortController = new AbortController();
  oldController.abort();
}

let isSessionExpiring = false;
let unauthorizedCount = 0; // Track consecutive unauthorized responses

// Actions that should NEVER trigger session expiry or show errors
const SILENT_ACTIONS = [
  'getUnreadNotificationCount', 'getNotificationHistory', 'registerPushToken',
  'getAlertSettings', 'getMonthlyForecast', 'getPeakHourPrediction'
];

// Actions that don't require a token
const PUBLIC_ACTIONS = [
  'login', 'register', 'check_email', 'sendVerificationCode', 'verifyOTP', 
  'resendVerificationCode', 'getTenantInvitationByEmail', 'getRoomByTenantCode',
  'requestPasswordReset', 'verifyResetOTP', 'resetPassword', 'registerPushToken'
];

/**
 * Core API call function with retry-on-unauthorized protection.
 */
export async function apiCall(action, data = {}, _isRetry = false) {
  try {
    const baseUrl = await getBaseUrl();
    const token = await AsyncStorage.getItem('@auth_token');
    
    // If no token and not a public action, skip silently
    if (!token && !PUBLIC_ACTIONS.includes(action)) {
      return null;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Bypass-Tunnel-Reminder': 'true'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = `${baseUrl}/api.php`;
    
    // Only log non-polling actions to reduce console noise
    if (!SILENT_ACTIONS.includes(action)) {
      console.log(`[API] ${action}`);
    }

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ action, ...data }),
      signal: abortController.signal
    });
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const result = await response.json();
      
      if (result.success) {
        // Reset unauthorized counter on any success
        unauthorizedCount = 0;
        isSessionExpiring = false;
        return result.data;
      }
      
      // Handle "Unauthorized" — possible transient error or real token expiry
      if (result.message && result.message.includes('Unauthorized')) {
        unauthorizedCount++;
        
        // RETRY ONCE: If this is the first failure, retry before clearing session.
        // This prevents a single bad response from cascading into a full logout.
        if (!_isRetry && unauthorizedCount < 3) {
          console.log(`[API] Retrying ${action} (attempt 2)...`);
          // Small delay to let any transient issue resolve
          await new Promise(r => setTimeout(r, 500));
          return apiCall(action, data, true);
        }
        
        // Multiple consecutive failures = real session expiry
        if (!isSessionExpiring) {
          isSessionExpiring = true;
          unauthorizedCount = 0;
          await AsyncStorage.multiRemove(['@auth_token', '@auth_user']);
          console.log('ℹ️ Session expired — redirecting to login.');
        }
        return null;
        
      } else if (SILENT_ACTIONS.includes(action)) {
        return null;
      } else {
        ErrorTracker.log('API', `Action [${action}] failed: ${result.message}`);
        throw new Error(result.message);
      }
    } else {
      // Non-JSON response (HTML error page, etc.)
      const text = await response.text();
      if (!SILENT_ACTIONS.includes(action)) {
        console.log(`[API Debug] Non-JSON response for ${action}:`, text.substring(0, 200));
      }
      return null;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return null;
    }
    
    // Silent actions never show errors
    if (SILENT_ACTIONS.includes(action)) {
      return null;
    }
    
    // Re-throw specific backend errors (like validation messages)
    if (error.message && !error.message.includes('Failed to connect') && !error.message.includes('Network request failed')) {
      throw error;
    }
    
    // Generic network error
    console.log(`[API] Network error for ${action}: ${error.message}`);
    throw new Error('Failed to connect to server. Check your internet or server status.');
  }
}
