import axios from 'axios';
import apiClient from './apiClient';

/**
 * In-memory map to throttle duplicate bridge error logs across consecutive invocations.
 */
const recentBridgeErrors = new Map();
const THROTTLE_WINDOW_MS = 10000; // 10 seconds

function logBridgeError(action, error) {
  const category = error.category || (error.code === 'ECONNABORTED' ? 'REQUEST_TIMEOUT' : 'API_ERROR');
  const statusStr = error.status ? ` (Status: ${error.status})` : (error.response?.status ? ` (Status: ${error.response.status})` : '');
  const diagMessage = error.diagnosticMessage || error.message || 'Unknown network error';
  const timestamp = error.timestamp || new Date().toISOString();

  const key = `${action}:${category}:${error.status || error.response?.status || ''}`;
  const now = Date.now();
  const existing = recentBridgeErrors.get(key);

  if (existing && (now - existing.lastLoggedTime < THROTTLE_WINDOW_MS)) {
    // Suppress duplicate identical warning within the throttle window
    existing.count += 1;
    return;
  }

  recentBridgeErrors.set(key, { lastLoggedTime: now, count: 1 });
  console.warn(`[API Bridge Error] [${category}] ${action}${statusStr}: ${diagMessage} (Time: ${timestamp})`);
}

/**
 * Bridge function to maintain compatibility with legacy components
 * while using the Secure API Client (Axios).
 * 
 * Supports:
 * - Structured diagnostic errors
 * - Background sync silence (avoids double logging when SyncEngine handles it)
 * - Automatic warning throttling
 * - Session handling
 */
export async function apiCall(action, data = {}, config = {}) {
  try {
    const response = await apiClient.post('/api.php', {
      action,
      ...data
    }, config);

    // Return data property to match legacy expectations
    return response.data?.data !== undefined ? response.data.data : response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.diagnosticMessage || error.message;
    const isCanceled = axios.isCancel(error) || message === 'canceled' || error.name === 'CanceledError' || error.message === 'Logging out';
    const isBackground = config.isBackgroundSync || config.suppressBridgeLog || config.silent;

    // Background sync engine handles its own deduplicated diagnostic logging.
    // Only log here for direct foreground calls to avoid double-warning spam.
    if (!isCanceled && !isBackground) {
      logBridgeError(action, error);
    }

    // Pass through auth error to background sync so it can detect invalid session
    if (config.isBackgroundSync) {
      throw error;
    }

    // Some legacy callers expect null on 401 session expiry
    if (error.response?.status === 401) {
      return null;
    }

    throw error;
  }
}

export function cancelAllRequests() {
  console.log('[API] Global request cancellation triggered');
}
