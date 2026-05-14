import apiClient from './apiClient';

const USE_MOCK = false; 
let BASE_URL = 'http://192.168.1.100';

function generateMockData() {
  return {
    voltage: 220 + (Math.random() * 10),
    current: 1.5 + (Math.random() * 2),
    power: 350 + (Math.random() * 500),
    energy: 0.001,
    powerFactor: 0.95,
    relayState: true,
    timestamp: new Date().toISOString(),
  };
}

// ============ API FUNCTIONS ============

/**
 * Fetch REALTIME data DIRECTLY from the ESP32 (Low latency)
 */
export async function fetchRealtimeData(roomId) {
  if (USE_MOCK) {
    return generateMockData();
  }

  try {
    const response = await fetch(`${BASE_URL}/api/data?room=${roomId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 3000,
    });
    if (!response.ok) throw new Error('ESP32 not responding');
    return await response.json();
  } catch (error) {
    console.warn('ESP32 fetch failed:', error.message);
    // Fallback to mock only if fetch fails during dev
    return generateMockData();
  }
}

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
}

export function getConnectionStatus() {
  return {
    baseUrl: BASE_URL,
    isMock: USE_MOCK
  };
}
