import apiClient from './apiClient';

// ============ CONNECTION STATE ============

let BASE_URL = 'http://192.168.1.100';
let _lastSuccessfulFetch = 0;
let _consecutiveFailures = 0;
const MAX_FAILURES_BEFORE_BACKOFF = 3;

/**
 * Check if the ESP32 device is considered connected.
 * Based on whether we've had a successful fetch within the last 60 seconds.
 */
export function isDeviceConnected() {
  if (_lastSuccessfulFetch === 0) return false;
  return (Date.now() - _lastSuccessfulFetch) < 60000;
}

/**
 * Get the current connection status.
 */
export function getConnectionStatus() {
  return {
    baseUrl: BASE_URL,
    connected: isDeviceConnected(),
    lastSuccess: _lastSuccessfulFetch > 0 ? new Date(_lastSuccessfulFetch).toISOString() : null,
    consecutiveFailures: _consecutiveFailures,
  };
}

// ============ API FUNCTIONS ============

/**
 * Fetch REALTIME data DIRECTLY from the ESP32 (Low latency).
 * 
 * CRITICAL FIX: Returns NULL when ESP32 is unreachable instead of mock data.
 * The dashboard must handle null gracefully by showing "Device Offline" state.
 */
export async function fetchRealtimeData(roomId) {
  // Circuit breaker: if too many consecutive failures, skip the fetch
  // to avoid spamming the network. Will retry after backoff.
  if (_consecutiveFailures >= MAX_FAILURES_BEFORE_BACKOFF) {
    const backoffMs = Math.min(30000, 5000 * Math.pow(2, _consecutiveFailures - MAX_FAILURES_BEFORE_BACKOFF));
    const timeSinceLastAttempt = Date.now() - _lastAttemptTime;
    if (timeSinceLastAttempt < backoffMs) {
      // Still in backoff period — return null without attempting
      return null;
    }
  }

  _lastAttemptTime = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/api/data?room=${roomId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 3000,
    });
    if (!response.ok) throw new Error('ESP32 not responding');
    
    const data = await response.json();
    
    // Validate that we got real sensor data
    if (!data || typeof data.power !== 'number' || data.power < 0) {
      console.warn('ESP32 returned invalid data:', data);
      return null;
    }

    // Success — reset failure counter
    _lastSuccessfulFetch = Date.now();
    _consecutiveFailures = 0;
    
    return data;
  } catch (error) {
    _consecutiveFailures++;
    // Only log on first failure or every 10th to avoid console spam
    if (_consecutiveFailures === 1 || _consecutiveFailures % 10 === 0) {
      console.warn(`ESP32 fetch failed (attempt #${_consecutiveFailures}):`, error.message);
    }
    // CRITICAL FIX: Return null instead of mock data.
    // The dashboard will show "Device Offline" state.
    return null;
  }
}

let _lastAttemptTime = 0;

/**
 * Toggle Relay via BACKEND (Centralized Control & Logging)
 */
export async function toggleRelay(roomId, state) {
  try {
    const response = await apiClient.post('/api.php?action=toggleRelay', { roomId, state });
    return response.data;
  } catch (error) {
    console.warn('Relay toggle failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch Historical Consumption from BACKEND (Database)
 */
export async function fetchHistoricalData(roomId, period = 'weekly') {
  try {
    const action = period === 'daily' ? 'getDailyBreakdownFiltered' : 
                   period === 'monthly' ? 'getMonthlyConsumptionFiltered' : 
                   'getConsumptionComparison';
    
    const response = await apiClient.post(`/api.php?action=${action}`, { 
        roomId,
        period,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    });
    
    return response.data.data || [];
  } catch (error) {
    console.warn('History fetch failed:', error.message);
    return [];
  }
}

export function setESP32BaseUrl(url) {
  BASE_URL = url;
  // Reset connection state when URL changes
  _lastSuccessfulFetch = 0;
  _consecutiveFailures = 0;
}
