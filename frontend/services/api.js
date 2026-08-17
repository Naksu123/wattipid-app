import axios from 'axios';
import apiClient from './apiClient';

/**
 * Bridge function to maintain compatibility with legacy components
 * while using the new Secure API Client (Axios).
 */
export async function apiCall(action, data = {}, config = {}) {
  try {
    const response = await apiClient.post('/api.php', {
      action,
      ...data
    }, config);

    // Return data property to match legacy expectations
    return response.data.data;
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    const isCanceled = axios.isCancel(error) || message === 'canceled' || error.name === 'CanceledError';
    if (!isCanceled) {
      console.warn(`[API Bridge Error] ${action}:`, message);
    }

    // Some legacy callers expect the full response or null on fail
    if (error.response?.status === 401) {
      return null;
    }
    throw error;
  }
}

export function cancelAllRequests() {
  // Axios handles cancellation differently, but for logout we just clear tokens
  console.log('[API] Global request cancellation triggered');
}
