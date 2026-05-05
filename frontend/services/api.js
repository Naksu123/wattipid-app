import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from './config';
import ErrorTracker from './errorTracker';

let abortController = new AbortController();

/**
 * Cancel all currently pending API requests.
 * Called during logout to prevent "Unauthorized" popups from background calls.
 */
export function cancelAllRequests() {
  abortController.abort();
  abortController = new AbortController(); // Re-initialize for next session
}

let isSessionExpiring = false;

export async function apiCall(action, data = {}) {
  try {
    const baseUrl = await getBaseUrl();
    const token = await AsyncStorage.getItem('@auth_token');
    
    // 1. Protection: If no token and not a public action, don't even try
    const publicActions = [
      'login', 'register', 'check_email', 'sendVerificationCode', 'verifyOTP', 
      'resendVerificationCode', 'getTenantInvitationByEmail', 'getRoomByTenantCode',
      'requestPasswordReset', 'verifyResetOTP', 'resetPassword'
    ];
    if (!token && !publicActions.includes(action)) {
      return null;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = `${baseUrl}/api.php`;
    console.log(`[API Request] Calling: ${fullUrl} | Action: ${action}`);

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
        // Reset the flag if a request succeeds
        isSessionExpiring = false;
        return result.data;
      }
      
      // Handle Failure
      if (result.message && result.message.includes('Unauthorized')) {
        // Prevent redundant logging and handling
        if (!isSessionExpiring) {
          isSessionExpiring = true;
          await AsyncStorage.multiRemove(['@auth_token', '@auth_user']);
          ErrorTracker.log('API', 'Session Expired', null, 'Your session has expired. Please log in again.');
        }
        return null; 
      } else {
        ErrorTracker.log('API', `Action [${action}] failed: ${result.message}`);
        throw new Error(result.message);
      }
    } else {
      const text = await response.text();
      console.log(`[API Debug] Raw Response for ${action}:`, text.substring(0, 500));
      // Only log if it's not an abort (aborting doesn't produce JSON)
      if (text) {
        ErrorTracker.log('API', `Non-JSON response for [${action}]`, text.substring(0, 200));
      }
      return null;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`[API] Request for ${action} was cancelled.`);
      return null;
    }
    console.error(`[API Error] Action: ${action} | Message: ${error.message}`);
    console.error(`[API URL]: ${await getBaseUrl()}/api.php`);
    ErrorTracker.log('API', `Network Error during [${action}]`, error.message);
    throw new Error('Failed to connect to server');
  }
}
