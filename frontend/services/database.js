import { apiCall } from './api';
import apiClient from './apiClient';

// ============ MOCK DB INIT FOR APP LOAD ============
export async function getDatabase() {
  // Return dummy object since sqlite is removed, but some files might still call it
  return { execAsync: async () => {}, runAsync: async () => {}, getFirstAsync: async () => {}, getAllAsync: async () => {} };
}

// ============ USER OPERATIONS ============
export async function createUser(name, email, password, role, roomId = null, tenantCode = null) {
  // Handled by AuthContext directly via register.php
  return null;
}

export async function saveVerificationCode(email, code) {
  // Legacy — now handled by sendVerificationCode in backend
  return await apiCall('saveVerificationCode', { email, code });
}

export async function validateVerificationCode(email, code) {
  // Legacy — now handled by verifyOTP in backend
  return await apiCall('validateVerificationCode', { email, code });
}

// ============ NEW EMAIL VERIFICATION API ============
export async function sendVerificationCodeAPI(email, name = '') {
  try {
    const data = await apiCall('sendVerificationCode', { email, name });
    return { success: true, ...(data || {}), message: 'Verification code sent' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function verifyOTPAPI(email, code, type = 'verification') {
  try {
    const data = await apiCall('verifyOTP', { email, code, type });
    return { success: true, ...(data || {}), message: 'Verified' };
  } catch (error) {
    return { 
      success: false, 
      message: error.message,
      status: error.message.toLowerCase().includes('expired') ? 'expired' : 'invalid'
    };
  }
}

export async function resendVerificationCodeAPI(email, name = '') {
  try {
    const data = await apiCall('resendVerificationCode', { email, name });
    return { success: true, ...(data || {}), message: 'New code sent' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function verifyUserEmail(email) {
  // Handled on backend
}

export async function getUserByEmail(email) {
  return await apiCall('getUserByEmail', { email });
}

export async function loginUser(email, password) {
  // Handled by AuthContext directly via login.php
  return null;
}

export async function updateUserProfile(id, name, email) {
  await apiCall('updateUserProfile', { id, name, email });
}

// ============ ROOM OPERATIONS ============
export async function getAllRooms() {
  return await apiCall('getAllRooms') || [];
}
export const getRooms = getAllRooms;

export async function getRoomByTenantCode(code) {
  return await apiCall('getRoomByTenantCode', { code });
}

export async function getRoomById(roomId) {
  return await apiCall('getRoomById', { roomId });
}

export async function getBuildingSummary() {
  return await apiCall('getBuildingSummary');
}

export async function getLiveOverview() {
  return await apiCall('getLiveOverview');
}

export async function updateRoomStatus(roomId, status, tenantName = null, startDate = null) {
  return await apiCall('updateRoomStatus', { roomId, status, tenantName, startDate });
}


export async function addRoom(roomData) {
  try {
    const response = await apiClient.post('/api.php', { action: 'addRoom', ...roomData });
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

export async function updateRoom(roomId, roomData) {
  try {
    const response = await apiClient.post('/api.php', { action: 'updateRoom', room_id: roomId, ...roomData });
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

export async function archiveRoom(roomId) {
  try {
    const response = await apiClient.post('/api.php', { action: 'archiveRoom', room_id: roomId });
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

export async function restoreRoom(roomId) {
  try {
    const response = await apiClient.post('/api.php', { action: 'restoreRoom', room_id: roomId });
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

export async function generateNewTenantCode(roomId) {
  try {
    const response = await apiClient.post('/api.php', { action: 'generateNewTenantCode', roomId });
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

export async function revokeTenant(roomId) {
  const result = await apiCall('revokeTenant', { roomId });
  return result ? { success: true, ...result } : { success: false, message: 'Failed' };
}

export async function transferTenant(fromRoomId, toRoomId) {
  const result = await apiCall('transferTenant', { fromRoomId, toRoomId });
  return result ? { success: true, ...result } : { success: false, message: 'Failed' };
}

export async function getTenantHistory(roomId) {
  return await apiCall('getTenantHistory', { roomId }) || [];
}

export async function getVacantRooms() {
  return await apiCall('getVacantRooms') || [];
}

// ============ INVITATION OPERATIONS ============
export async function saveTenantInvitation(email, roomId) {
  try {
    const response = await apiClient.post('/api.php', { action: 'saveTenantInvitation', email, roomId });
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

export async function getTenantInvitationByEmail(email) {
  try {
    const data = await apiCall('getTenantInvitationByEmail', { email });
    return data ? { success: true, ...data } : null;
  } catch (error) {
    // Return the failure so emailService can handle specific cases like 'expired'
    return { 
      success: false, 
      message: error.message, 
      expired: error.message.toLowerCase().includes('expired') 
    };
  }
}

export async function markInvitationUsed(email) {
  // Simplified logic, handled on backend or omitted for brevity
}

// ============ CONSUMPTION IOT OPERATIONS ============
export async function logConsumption(roomId, voltage, current, power, energy, cost, category = null, description = null) {
  await apiCall('logConsumption', { roomId, voltage, current, power, energy, cost });
}

export async function getConsumptionHistory(roomId, period = 'daily', tenantName = null, year = null, month = null, dateStr = null, options = {}) {
  const data = await apiCall('getConsumptionHistory', { roomId, period, tenantName, year, month, dateStr }, options);
  return (data || []).map(d => ({
    ...d,
    energy: parseFloat(d.totalEnergy || d.energy || 0),
    cost: parseFloat(d.totalCost || d.cost || 0),
    avgPower: parseFloat(d.avgPower || 0),
    peakPower: parseFloat(d.peakPower || 0),
    label: d.hour !== undefined ? d.hour : d.day,
  }));
}

export async function getTotalConsumptionToday(roomId, tenantName = null, options = {}) {
  const data = await apiCall('getTotalConsumptionToday', { roomId, tenantName }, options);
  return data ? { totalEnergy: parseFloat(data.totalEnergy || 0), totalCost: parseFloat(data.totalCost || 0) } : { totalEnergy: 0, totalCost: 0 };
}

export async function getTotalConsumptionWeek(roomId, tenantName = null, options = {}) {
  const data = await apiCall('getTotalConsumptionWeek', { roomId, tenantName }, options);
  return data ? { totalEnergy: parseFloat(data.totalEnergy || 0), totalCost: parseFloat(data.totalCost || 0), entryCount: parseInt(data.entryCount || 0) } : { totalEnergy: 0, totalCost: 0, entryCount: 0 };
}

export async function getTotalConsumptionMonth(roomId, tenantName = null, options = {}) {
  const data = await apiCall('getTotalConsumptionMonth', { roomId, tenantName }, options);
  return data ? { totalEnergy: parseFloat(data.totalEnergy || 0), totalCost: parseFloat(data.totalCost || 0) } : { totalEnergy: 0, totalCost: 0 };
}

export async function getTransactionHistory(roomId, limit = 50, filter = 'minute', tenantName = null, offset = 0, startDate = null, endDate = null) {
  const data = await apiCall('getTransactionHistory', { roomId, limit, filter, tenantName, offset, startDate, endDate });
  return data || [];
}

export async function getAvailableBillingCycles(roomId, options = {}) {
  return await apiCall('getAvailableBillingCycles', { roomId }, options) || [];
}

export async function getConsumptionComparison(roomId, period = 'weekly', tenantName = null, options = {}) {
  try {
    const data = await apiCall('getConsumptionComparison', { roomId, period, tenantName }, options);
    
    const currEnergy = parseFloat(data?.current?.totalEnergy);
    const currCost = parseFloat(data?.current?.totalCost);
    const prevEnergy = parseFloat(data?.previous?.totalEnergy);
    const prevCost = parseFloat(data?.previous?.totalCost);

    const current = {
      totalEnergy: Number.isFinite(currEnergy) ? Math.max(0, currEnergy) : 0,
      totalCost: Number.isFinite(currCost) ? Math.max(0, currCost) : 0
    };
    
    const previous = {
      totalEnergy: Number.isFinite(prevEnergy) ? Math.max(0, prevEnergy) : 0,
      totalCost: Number.isFinite(prevCost) ? Math.max(0, prevCost) : 0
    };

    const costDiff = current.totalCost - previous.totalCost;
    const energyDiff = current.totalEnergy - previous.totalEnergy;
    
    let costPctChange = 0;
    if (previous.totalCost > 0) {
      costPctChange = (costDiff / previous.totalCost) * 100;
    } else if (current.totalCost > 0) {
      costPctChange = 100; // New spending from zero
    }
    if (!Number.isFinite(costPctChange)) costPctChange = 0;

    let energyPctChange = 0;
    if (previous.totalEnergy > 0) {
      energyPctChange = (energyDiff / previous.totalEnergy) * 100;
    } else if (current.totalEnergy > 0) {
      energyPctChange = 100; // New energy from zero
    }
    if (!Number.isFinite(energyPctChange)) energyPctChange = 0;

    return { 
      current, 
      previous, 
      costDiff: Number.isFinite(costDiff) ? costDiff : 0, 
      energyDiff: Number.isFinite(energyDiff) ? energyDiff : 0, 
      costPctChange, 
      energyPctChange,
      isAbnormal: !!data?.isAbnormal,
      isBudgetExceeded: !!data?.isBudgetExceeded
    };
  } catch (err) {
    console.warn('[getConsumptionComparison] error:', err?.message || err);
    return {
      current: { totalEnergy: 0, totalCost: 0 },
      previous: { totalEnergy: 0, totalCost: 0 },
      costDiff: 0,
      energyDiff: 0,
      costPctChange: 0,
      energyPctChange: 0,
      isAbnormal: false,
      isBudgetExceeded: false
    };
  }
}

export async function getDailyBreakdown(roomId, year, month, tenantName = null) {
  const data = await apiCall('getDailyBreakdown', { roomId, year, month, tenantName });
  return (data || []).map(d => ({
    ...d,
    totalEnergy: parseFloat(d.totalEnergy || 0),
    totalCost: parseFloat(d.totalCost || 0),
    avgPower: parseFloat(d.avgPower || 0),
    peakPower: parseFloat(d.peakPower || 0),
    entries: parseInt(d.entries || 0)
  }));
}

export async function getMonthlyConsumptionFiltered(roomId, year, month, tenantStartDate, moveOutDate, tenantName = null) {
  const data = await apiCall('getMonthlyConsumptionFiltered', { roomId, year, month, tenantStartDate, moveOutDate, tenantName });
  return data ? { totalEnergy: parseFloat(data.totalEnergy || 0), totalCost: parseFloat(data.totalCost || 0), entryCount: parseInt(data.entryCount || 0) } : { totalEnergy: 0, totalCost: 0, entryCount: 0 };
}

export async function getDailyBreakdownFiltered(roomId, year, month, tenantStartDate, moveOutDate, tenantName = null) {
  const data = await apiCall('getDailyBreakdownFiltered', { roomId, year, month, tenantStartDate, moveOutDate, tenantName });
  return (data || []).map(d => ({
    ...d,
    totalEnergy: parseFloat(d.totalEnergy || 0),
    totalCost: parseFloat(d.totalCost || 0),
    entries: parseInt(d.entries || 0)
  }));
}

export async function getHourlyBreakdown(roomId, tenantName = null, dateStr = null) {
  const data = await apiCall('getHourlyBreakdown', { roomId, tenantName, dateStr });
  return (data || []).map(d => ({
    ...d,
    totalEnergy: parseFloat(d.totalEnergy || 0),
    totalCost: parseFloat(d.totalCost || 0),
    avgPower: parseFloat(d.avgPower || 0),
    peakPower: parseFloat(d.peakPower || 0),
    entries: parseInt(d.entries || 0)
  }));
}

// ============ BUDGET OPERATIONS ============
export async function setBudget(roomId, monthlyBudget) {
  const numericBudget = Number(monthlyBudget) || 0;
  const data = await apiCall('setBudget', { roomId, monthlyBudget: numericBudget });
  const daysInMonth = Number(data?.daysInMonth || data?.days_in_month || 30);
  const daily = Number(data?.dailyAllowance || data?.daily_allowance || (numericBudget / daysInMonth));
  const weekly = Number(data?.weeklyAllowance || data?.weekly_allowance || (numericBudget / (daysInMonth / 7)));
  const today = new Date().getDate();
  const remaining = Math.max(0, daysInMonth - today + 1);

  return {
    monthly_budget: numericBudget,
    daily_allowance: daily,
    weekly_allowance: weekly,
    days_in_month: daysInMonth,
    remaining_days: remaining,
    ...(data || {})
  };
}

export async function getBudget(roomId) {
  return await apiCall('getBudget', { roomId });
}

export async function resetBudget(roomId) {
  await apiCall('resetBudget', { roomId });
}

export async function getBillingCycle(roomId) {
  return await apiCall('getBillingCycle', { roomId });
}

// ============ SETTINGS ============
export async function getSetting(key) {
  const data = await apiCall('getSetting', { key });
  return data;
}

export async function getMultipleSettings(keys) {
  const data = await apiCall('getMultipleSettings', { keys });
  return data;
}

export async function setSetting(key, value) {
  await apiCall('setSetting', { key, value });
}

export async function getNotifications(roomId, userId = null) {
  return await apiCall('getNotifications', { roomId, userId }) || [];
}

export async function markNotificationRead(id) {
  await apiCall('markNotificationRead', { id });
}

export async function getTenantBillingHistory(roomId, limit = 20, offset = 0) {
  return await apiCall('getBillingHistory', { roomId, limit, offset }) || [];
}

export async function getBillingDetails(invoiceNumber, id = null, roomId = null) {
  return await apiCall('getBillingDetails', { invoiceNumber, id, roomId });
}

export async function getTenantBillingOverview(roomId = null, tenantName = null) {
  return await apiCall('getTenantBillingOverview', { roomId, tenantName });
}

export async function getPaymentInsights(roomId) {
  const data = await apiCall('getPaymentInsights', { roomId });
  return data ? { success: true, data: data.data || data } : { success: false, data: null };
}

export async function verifyAccessCodeAPI(email, accessCode) {
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  const normalizedCode = accessCode ? accessCode.trim() : '';

  console.log('[AccessCode] Verifying access code');
  console.log(`[AccessCode] Email: ${normalizedEmail}`);
  console.log(`[AccessCode] Code provided: ${normalizedCode ? 'yes' : 'no'}`);
  console.log('[AccessCode] Request endpoint: /api.php (action: verifyAccessCode)');

  try {
    const response = await apiClient.post('/api.php', {
      action: 'verifyAccessCode',
      email: normalizedEmail,
      accessCode: normalizedCode,
    });

    console.log(`[AccessCode] Response status: ${response.status}`);
    console.log('[AccessCode] Response body:', response.data);

    return response.data; // { success: true, message: '...', data: {...} }
  } catch (error) {
    const status = error.response?.status || 'Network/Client Error';
    const responseData = error.response?.data;

    console.log(`[AccessCode] Response status: ${status}`);
    console.log('[AccessCode] Response body:', responseData || error.message);

    return {
      success: false,
      error_code: responseData?.error_code || 'VERIFICATION_FAILED',
      message: responseData?.message || error.message || 'Unable to verify access code.',
    };
  }
}

