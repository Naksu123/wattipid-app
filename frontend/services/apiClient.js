import axios from 'axios';
import { Alert, DeviceEventEmitter } from 'react-native';
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

// --- REQUEST INTERCEPTOR ---
// Automatically injects the Access Token into every request
apiClient.interceptors.request.use(
  async (config) => {
    // Silence aggressive polling logs
    const isPolling = config.url?.includes('syncState') || config.url?.includes('getLatestConsumption') || config.data?.action === 'syncState' || config.data?.action === 'getLatestConsumption';
    
    // Robust Logging (Phase 1)
    if (!isPolling) {
        console.log("Request URL:", config.baseURL + config.url);
        if (config.data) console.log("Request Data:", config.data);
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

// --- RESPONSE INTERCEPTOR ---
apiClient.interceptors.response.use(
  (response) => {
    const isPolling = response.config.url?.includes('syncState') || response.config.url?.includes('getLatestConsumption') || response.config.data?.includes('syncState') || response.config.data?.includes('getLatestConsumption');

    // Robust Logging (Phase 1)
    if (!isPolling) {
        console.log("Response:", response.status, response.config.url);
    }

    // Basic JSON check
    if (typeof response.data === 'string' && (response.data.includes('<?php') || response.data.includes('require_once'))) {
        console.error('[API Diagnostic] Server leaked PHP code:', response.data.substring(0, 200));
        throw new Error('Server returned source code instead of JSON. Check PHP tags.');
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If we're logging out, silently swallow all errors
    if (isLoggingOut) {
      return Promise.resolve({ data: { success: false, message: 'Logging out' } });
    }

    // Initialize retry count for network errors (Phase 5)
    if (originalRequest && !originalRequest._retryCount) {
        originalRequest._retryCount = 0;
    }

    // Phase 5: Implement retry mechanism (Retry Request 3 Times)
    if (originalRequest && (error.message === 'Network Error' || error.code === 'ECONNABORTED' || error.response?.status >= 500)) {
        if (originalRequest._retryCount < 3) {
            originalRequest._retryCount++;
            console.log(`[Network] Retrying request (${originalRequest._retryCount}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return apiClient(originalRequest);
        }
    }

    // Phase 7: Replace raw Axios errors with user-friendly messages
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        error.message = 'No internet connection detected. Unable to reach the Wattipid server.';
    } else if (error.response?.status >= 500) {
        error.message = 'Unable to process your request at this time. Server is currently unavailable.';
    }

    const isAuthRoute = originalRequest?.url?.includes('action=login') || originalRequest?.url?.includes('action=register');

    // Handle 401 Session Expiration
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        const refreshToken = await Storage.getItem('refresh_token');
        if (!refreshToken) {
          await Storage.deleteItem('user_token');
          await Storage.deleteItem('refresh_token');
          await Storage.deleteItem('user_data');
          if (!isLoggingOut) DeviceEventEmitter.emit('showToast', { message: 'Session Expired. Please log in again.', type: 'error' });
          return Promise.resolve({ data: { success: false, message: 'Session expired' } });
        }

        const response = await axios.post(`${API_URL}/api.php?action=refreshToken`, { refreshToken });
        if (response.data.success) {
          const { token, refreshToken: newRefreshToken } = response.data.data;
          await Storage.setItem('user_token', token);
          await Storage.setItem('refresh_token', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        await Storage.deleteItem('user_token');
        await Storage.deleteItem('refresh_token');
        await Storage.deleteItem('user_data');
        if (!isLoggingOut) DeviceEventEmitter.emit('showToast', { message: 'Session Expired. Please log in again.', type: 'error' });
        return Promise.resolve({ data: { success: false, message: 'Session expired' } });
      }
    }

    // Show friendly toast message
    const isSyncRoute = originalRequest?.url?.includes('action=syncTenantData') || originalRequest?.url?.includes('action=syncLandlordData') || originalRequest?.url?.includes('action=syncState') || originalRequest?.data?.action === 'syncState' || originalRequest?.data?.includes?.('syncState');
    if (!isLoggingOut && !isAuthRoute && !isSyncRoute) {
        DeviceEventEmitter.emit('showToast', { message: error.message, type: 'error', duration: 4000 });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
