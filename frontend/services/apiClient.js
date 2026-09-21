import axios from 'axios';
import { DeviceEventEmitter } from 'react-native';
import Storage from './storage';
import { API_URL } from './config';

/**
 * Wattipid Secure API Client
 * Features:
 * 1. Automatic JWT Injection
 * 2. Automatic Refresh Token Rotation
 * 3. Centralized Error Handling
 */

// Global flag to suppress "Session Expired" alerts during intentional logout
let isLoggingOut = false;
export const getIsLoggingOut = () => isLoggingOut;
export const setIsLoggingOut = (val) => { isLoggingOut = val; };

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true', // Prevents LocalTunnel HTML reminder pages
  },
  timeout: 15000,
});

// --- IN-FLIGHT REQUEST DEDUPLICATION ---
// Prevents duplicate concurrent read/sync requests from firing simultaneously
const inFlightRequests = new Map();

function getRequestDeduplicationKey(config) {
  if (!config || config.skipDeduplication) return null;

  const method = (config.method || 'get').toLowerCase();
  const url = config.url || '';

  let action = '';
  if (typeof config.data === 'string') {
    try {
      const parsed = JSON.parse(config.data);
      action = parsed?.action || '';
    } catch {}
  } else if (config.data && typeof config.data === 'object') {
    action = config.data.action || '';
  }
  if (!action && url) {
    const match = url.match(/[?&]action=([^&]+)/);
    if (match) action = match[1];
  }

  // Deduplicate GET requests and idempotent read/sync actions
  const isGet = method === 'get';
  const isSafeReadAction = 
    action.startsWith('get') || 
    action.startsWith('fetch') || 
    action.startsWith('sync') ||
    action === 'checkTermsAcceptance';

  // NEVER deduplicate sensitive mutations (payments, updates, deletions, toggles, auth)
  if (!isGet && !isSafeReadAction) {
    return null;
  }

  let bodyStr = '';
  if (config.data) {
    bodyStr = typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
  }
  const paramsStr = config.params ? JSON.stringify(config.params) : '';

  return `${method}:${url}:${bodyStr}:${paramsStr}`;
}

const originalRequestFn = apiClient.request.bind(apiClient);

apiClient.request = function (configOrUrl, maybeConfig) {
  let config = typeof configOrUrl === 'string' 
    ? { ...(maybeConfig || {}), url: configOrUrl } 
    : { ...(configOrUrl || {}) };

  const key = getRequestDeduplicationKey(config);
  if (key && inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const promise = originalRequestFn(config).finally(() => {
    if (key) {
      inFlightRequests.delete(key);
    }
  });

  if (key) {
    inFlightRequests.set(key, promise);
  }

  return promise;
};

// --- REQUEST INTERCEPTOR ---
// Automatically injects the Access Token into every request
apiClient.interceptors.request.use(
  async (config) => {
    // Extract action for routing & timeout decisions
    let action = '';
    if (typeof config.data === 'string') {
      try {
        action = JSON.parse(config.data)?.action || '';
      } catch {}
    } else if (config.data && typeof config.data === 'object') {
      action = config.data.action || '';
    }
    if (!action && config.url) {
      const match = config.url.match(/[?&]action=([^&]+)/);
      if (match) action = match[1];
    }

    const isPolling = config.url?.includes('syncState') || 
                      config.url?.includes('getLatestConsumption') || 
                      action === 'syncState' || 
                      action === 'getLatestConsumption' ||
                      action === 'syncTenantData' ||
                      action === 'syncLandlordData';

    // Differentiated timeout: 8s for background sync & polling, 15s for normal requests
    if (config.isBackgroundSync || isPolling) {
      if (!config.timeoutExplicitlySet && (!config.timeout || config.timeout === 15000)) {
        config.timeout = 8000;
      }
    }

    // Skip injecting tokens if we're logging out
    if (isLoggingOut) return config;
    const token = await Storage.getItem('user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['X-Authorization'] = `Bearer ${token}`; // Fallback for reverse proxies
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- TOKEN REFRESH QUEUE ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- RESPONSE INTERCEPTOR ---
apiClient.interceptors.response.use(
  (response) => {
    // Defensive JSON & BOM Handling: If response.data is a string, check for BOM or valid JSON
    if (typeof response.data === 'string') {
        if (response.data.includes('<?php') || response.data.includes('require_once')) {
            console.error('[API Diagnostic] Server leaked PHP code:', response.data.substring(0, 200));
            throw new Error('Server returned source code instead of JSON. Check PHP tags.');
        }

        let rawStr = response.data;
        // Strip UTF-8 BOM if present (\uFEFF)
        if (rawStr.charCodeAt(0) === 0xFEFF) {
            rawStr = rawStr.slice(1);
        }
        rawStr = rawStr.trim();
        if ((rawStr.startsWith('{') && rawStr.endsWith('}')) || (rawStr.startsWith('[') && rawStr.endsWith(']'))) {
            try {
                response.data = JSON.parse(rawStr);
            } catch (e) {
                console.warn('[apiClient] Could not auto-recover JSON string:', e.message);
            }
        }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If we're logging out, silently swallow all errors
    if (isLoggingOut) {
      return Promise.resolve({ data: { success: false, message: 'Logging out' } });
    }

    // Extract action from payload or url for route classification
    let reqAction = '';
    try {
      if (typeof originalRequest?.data === 'string') {
        reqAction = JSON.parse(originalRequest.data)?.action || '';
      } else if (originalRequest?.data && typeof originalRequest.data === 'object') {
        reqAction = originalRequest.data.action || '';
      }
    } catch {}
    if (!reqAction && originalRequest?.url) {
      const match = originalRequest.url.match(/[?&]action=([^&]+)/);
      if (match) reqAction = match[1];
    }

    const isPollingOrSync = originalRequest?.url?.includes('syncState') || 
                           originalRequest?.url?.includes('getLatestConsumption') || 
                           reqAction === 'syncState' || 
                           reqAction === 'getLatestConsumption' ||
                           reqAction === 'syncTenantData' ||
                           reqAction === 'syncLandlordData' ||
                           originalRequest?.isBackgroundSync;

    const isGet = originalRequest?.method?.toLowerCase() === 'get';
    const isIdempotentPost = originalRequest?.idempotent === true || 
                             reqAction.startsWith('get') || 
                             reqAction.startsWith('sync') ||
                             reqAction === 'toggleRelay';

    const canRetry = isGet || isIdempotentPost;
    const isNetworkError = error.message === 'Network Error' || error.code === 'ECONNABORTED' || error.response?.status >= 500;

    // Fast-fail background sync/polling so cached UI is never blocked!
    // Only retry user-initiated idempotent requests with max 2 quick retries (1s, 2s)
    if (originalRequest && isNetworkError && canRetry && !isPollingOrSync) {
        if (!originalRequest._retryCount) originalRequest._retryCount = 0;
        if (originalRequest._retryCount < 2) {
            originalRequest._retryCount++;
            const backoffMs = originalRequest._retryCount * 1000; // 1s, 2s
            console.log(`[Network] Retrying request (${originalRequest._retryCount}/2) in ${backoffMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            return apiClient.request(originalRequest);
        }
    }

    // Phase 7: Replace raw Axios errors with user-friendly messages
    if (error.code === 'ECONNABORTED') {
        error.message = 'Your request is taking longer than expected. Please check your connection.';
    } else if (error.message === 'Network Error') {
        error.message = 'Unable to connect. Please check your internet connection.';
    } else if (error.response?.status >= 500) {
        error.message = 'The server is temporarily unavailable. We are trying to reconnect.';
    } else if (error.response?.status === 429) {
        error.message = 'Too many requests. Please wait a moment.';
    }

    const authActions = ['login', 'register', 'verifyAccessCode', 'requestPasswordReset', 'verifyResetOTP', 'sendVerificationCode', 'resendVerificationCode'];
    const isAuthRoute = authActions.includes(reqAction) || originalRequest?.url?.includes('action=login') || originalRequest?.url?.includes('action=register') || originalRequest?.url?.includes('action=verifyAccessCode');

    // Handle 401 Session Expiration
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return apiClient.request(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await Storage.getItem('refresh_token');
        if (!refreshToken) {
          await Storage.deleteItem('user_token');
          await Storage.deleteItem('refresh_token');
          await Storage.deleteItem('user_data');
          if (!isLoggingOut) {
            DeviceEventEmitter.emit('forceLogout');
            DeviceEventEmitter.emit('showToast', { message: 'Session Expired. Please log in again.', type: 'error' });
          }
          processQueue(error, null);
          isRefreshing = false;
          return Promise.resolve({ data: { success: false, message: 'Session expired' } });
        }

        const response = await axios.post(`${API_URL}/api.php?action=refreshToken`, { refreshToken });
        if (response.data.success) {
          const { token, refreshToken: newRefreshToken } = response.data.data;
          await Storage.setItem('user_token', token);
          await Storage.setItem('refresh_token', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          processQueue(null, token);
          isRefreshing = false;
          
          return apiClient.request(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (_refreshError) {
        await Storage.deleteItem('user_token');
        await Storage.deleteItem('refresh_token');
        await Storage.deleteItem('user_data');
        if (!isLoggingOut) {
          DeviceEventEmitter.emit('forceLogout');
          DeviceEventEmitter.emit('showToast', { message: 'Session Expired. Please log in again.', type: 'error' });
        }
        processQueue(error, null); // Reject queued requests with original 401 error
        isRefreshing = false;
        return Promise.resolve({ data: { success: false, message: 'Session expired' } });
      }
    }

    // Show friendly toast message
    const isSyncRoute = originalRequest?.url?.includes('action=syncTenantData') || originalRequest?.url?.includes('action=syncLandlordData') || originalRequest?.url?.includes('action=syncState') || originalRequest?.data?.action === 'syncState' || originalRequest?.data?.includes?.('syncState');
    const isReminderRoute = originalRequest?.data?.action === 'send_manual_reminder';
    const isCanceled = axios.isCancel(error) || error.message === 'canceled' || error.name === 'CanceledError';
    if (!isLoggingOut && !isAuthRoute && !isSyncRoute && !isReminderRoute && !isCanceled) {
      let userMessage = error.response?.data?.message || 'Unable to process your request at this time. Server is currently unavailable.';
      if (typeof userMessage === 'string' && (userMessage.toLowerCase().includes('database') || userMessage.toLowerCase().includes('sqlstate'))) {
        userMessage = 'Database service is temporarily reconnecting. Please pull to refresh.';
      }
      DeviceEventEmitter.emit('showToast', { message: userMessage, type: 'error', duration: 4000 });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
