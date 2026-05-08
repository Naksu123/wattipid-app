const USE_MOCK = true;
let BASE_URL = 'http://192.168.1.100'; // Update with real ESP32 IP

function generateMockData() {
  const baseVoltage = 220;
  const baseCurrent = Math.random() * 3 + 0.5;
  const voltage = baseVoltage + (Math.random() - 0.5) * 10;
  const current = baseCurrent + (Math.random() - 0.5) * 0.3;
  const power = voltage * current;
  const energyPerInterval = power / 3600000 * 5000; // 5 second interval in kWh

  return {
    voltage: Math.round(voltage * 100) / 100,
    current: Math.round(current * 100) / 100,
    power: Math.round(power * 100) / 100,
    energy: Math.round(energyPerInterval * 10000) / 10000,
    powerFactor: Math.round((0.85 + Math.random() * 0.12) * 100) / 100,
    relayState: true,
    timestamp: new Date().toISOString(),
  };
}

function generateMockHistory(days = 7, period = 'weekly') {
  const history = [];
  const now = new Date();

  if (period === 'daily') {
    // Generate 24 hourly entries (00:00–23:59) for today
    for (let h = 0; h <= now.getHours(); h++) {
      const hourlyEnergy = 0.1 + Math.random() * 0.5; // 0.1-0.6 kWh per hour
      history.push({
        date: now.toISOString().split('T')[0],
        hour: h,
        label: `${String(h).padStart(2, '0')}:00`,
        energy: Math.round(hourlyEnergy * 10000) / 10000,
        cost: Math.round(hourlyEnergy * 12.5 * 100) / 100,
        avgPower: Math.round(hourlyEnergy * 1000 * 100) / 100,
        peakPower: Math.round(hourlyEnergy * 1500 * 100) / 100,
      });
    }
  } else if (period === 'weekly') {
    // Generate Mon–Sun data for current ISO week
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);

    for (let d = 0; d < 7; d++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + d);
      if (date > now) break; // Don't generate future data
      const dailyEnergy = 2 + Math.random() * 6;
      history.push({
        date: date.toISOString().split('T')[0],
        energy: Math.round(dailyEnergy * 100) / 100,
        cost: Math.round(dailyEnergy * 12.5 * 100) / 100,
        avgPower: Math.round((dailyEnergy / 24) * 1000 * 100) / 100,
        peakPower: Math.round((dailyEnergy / 12) * 1000 * 100) / 100,
      });
    }
  } else {
    // Monthly: Day 1 to current day (or 31)
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const maxDay = Math.min(now.getDate(), daysInMonth);

    for (let d = 1; d <= maxDay; d++) {
      const date = new Date(year, month, d);
      const dailyEnergy = 2 + Math.random() * 6;
      history.push({
        date: date.toISOString().split('T')[0],
        day: d,
        energy: Math.round(dailyEnergy * 100) / 100,
        cost: Math.round(dailyEnergy * 12.5 * 100) / 100,
        avgPower: Math.round((dailyEnergy / 24) * 1000 * 100) / 100,
        peakPower: Math.round((dailyEnergy / 12) * 1000 * 100) / 100,
      });
    }
  }
  return history;
}

// ============ API FUNCTIONS ============

export async function fetchRealtimeData(roomId) {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate latency
    return generateMockData();
  }

  try {
    const response = await fetch(`${BASE_URL}/api/data?room=${roomId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
    if (!response.ok) throw new Error('ESP32 not responding');
    return await response.json();
  } catch (error) {
    console.warn('ESP32 fetch failed:', error.message);
    return { voltage: 0, current: 0, power: 0, energy: 0, powerFactor: 0, relayState: false };
  }
}

export async function toggleRelay(roomId, state) {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, relayState: state, roomId };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: roomId, state }),
    });
    return await response.json();
  } catch (error) {
    console.warn('Relay toggle failed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function fetchHistoricalData(roomId, period = 'weekly') {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    return generateMockHistory(days, period);
  }

  try {
    const response = await fetch(`${BASE_URL}/api/history?room=${roomId}&period=${period}`);
    return await response.json();
  } catch (error) {
    console.warn('History fetch failed:', error.message);
    const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    return generateMockHistory(days, period);
  }
}

export function setESP32BaseUrl(url) {
  BASE_URL = url;
}

export function getConnectionStatus() {
  return { isMock: USE_MOCK, baseUrl: BASE_URL };
}
