import axios from 'axios';
import { Alert } from 'react-native';
import Storage from './storage';
import { API_URL } from './config';

/**
 * Wattipid Secure API Client
 * Features:
 * 1. Automatic JWT Injection
 * 2. Automatic Refresh Token Rotation
 * 3. Centralized Error Handling
 */

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
    // Basic JSON check: If response.data is a string starting with "<?php" or "require", it's a leak
    if (typeof response.data === 'string' && (response.data.includes('<?php') || response.data.includes('require_once'))) {
        console.error('[API Diagnostic] Server leaked PHP code:', response.data.substring(0, 200));
        throw new Error('Server returned source code instead of JSON. Check PHP tags.');
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle JSON Parsing Errors / Malformed Responses
    if (error.message.includes('JSON') || !error.response) {
        console.error('[API Diagnostic] Malformed response or Network Error:', error.message);
    }

    const isAuthRoute = originalRequest.url?.includes('action=login') || originalRequest.url?.includes('action=register');

    // If error is 401 and we haven't retried yet, AND it's not a login attempt
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        const refreshToken = await Storage.getItem('refresh_token');
        if (!refreshToken) {
          // If no refresh token, the session is unrecoverable. Purge everything.
          await Storage.deleteItem('user_token');
          await Storage.deleteItem('refresh_token');
          await Storage.deleteItem('user_data');
          Alert.alert('Session Expired', 'Your security token has expired. Please restart the app or go to Profile -> Logout, then log back in to see your data.');
          return Promise.resolve({ data: { success: false, message: 'Session expired' } });
        }

        // Call the refresh endpoint on the backend
        const response = await axios.post(`${API_URL}/api.php?action=refreshToken`, {
          refreshToken: refreshToken,
        });

        if (response.data.success) {
          const { token, refreshToken: newRefreshToken } = response.data.data;

          // Store new tokens securely
          await Storage.setItem('user_token', token);
          await Storage.setItem('refresh_token', newRefreshToken);

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, the session is dead. Clean up and force logout.
        await Storage.deleteItem('user_token');
        await Storage.deleteItem('refresh_token');
        await Storage.deleteItem('user_data');
        
        Alert.alert('Session Expired', 'Your security token has expired. Please restart the app or go to Profile -> Logout, then log back in to see your data.');
        return Promise.resolve({ data: { success: false, message: 'Session expired' } });
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
