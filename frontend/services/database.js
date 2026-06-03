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
export async function saveTenantInvitation(email, roomId, tenantCode) {
  try {
    const response = await apiClient.post('/api.php', { action: 'saveTenantInvitation', email, roomId, tenantCode });
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

export async function getConsumptionHistory(roomId, period = 'daily', tenantName = null) {
  const data = await apiCall('getConsumptionHistory', { roomId, period, tenantName });
  return (data || []).map(d => ({
    ...d,
    energy: parseFloat(d.totalEnergy || d.energy || 0),
    cost: parseFloat(d.totalCost || d.cost || 0),
    avgPower: parseFloat(d.avgPower || 0),
    peakPower: parseFloat(d.peakPower || 0),
    label: d.hour !== undefined ? d.hour : d.day,
  }));
}

export async function getTotalConsumptionToday(roomId, tenantName = null) {
  const data = await apiCall('getTotalConsumptionToday', { roomId, tenantName });
  return data ? { totalEnergy: parseFloat(data.totalEnergy || 0), totalCost: parseFloat(data.totalCost || 0) } : { totalEnergy: 0, totalCost: 0 };
}

export async function getTotalConsumptionWeek(roomId, tenantName = null) {
  const data = await apiCall('getTotalConsumptionWeek', { roomId, tenantName });
  return data ? { totalEnergy: parseFloat(data.totalEnergy || 0), totalCost: parseFloat(data.totalCost || 0), entryCount: parseInt(data.entryCount || 0) } : { totalEnergy: 0, totalCost: 0, entryCount: 0 };
}

export async function getTotalConsumptionMonth(roomId, tenantName = null) {
  const data = await apiCall('getTotalConsumptionMonth', { roomId, tenantName });
  return data ? { totalEnergy: parseFloat(data.totalEnergy || 0), totalCost: parseFloat(data.totalCost || 0) } : { totalEnergy: 0, totalCost: 0 };
}

export async function getTransactionHistory(roomId, limit = 50, filter = 'minute', tenantName = null, offset = 0, startDate = null, endDate = null) {
  const data = await apiCall('getTransactionHistory', { roomId, limit, filter, tenantName, offset, startDate, endDate });
  return data || [];
}

export async function getAvailableBillingCycles(roomId) {
  return await apiCall('getAvailableBillingCycles', { roomId }) || [];
}

export async function getConsumptionComparison(roomId, period = 'weekly', tenantName = null) {
  const data = await apiCall('getConsumptionComparison', { roomId, period, tenantName });
  
  const current = {
    totalEnergy: parseFloat(data?.current?.totalEnergy || 0),
    totalCost: parseFloat(data?.current?.totalCost || 0)
  };
  
  const previous = {
    totalEnergy: parseFloat(data?.previous?.totalEnergy || 0),
    totalCost: parseFloat(data?.previous?.totalCost || 0)
  };

  const costDiff = current.totalCost - previous.totalCost;
  const energyDiff = current.totalEnergy - previous.totalEnergy;
  
  const costPctChange = previous.totalCost > 0 ? (costDiff / previous.totalCost) * 100 : 0;
  const energyPctChange = previous.totalEnergy > 0 ? (energyDiff / previous.totalEnergy) * 100 : 0;

  return { 
    current, 
    previous, 
    costDiff, 
    energyDiff, 
    costPctChange, 
    energyPctChange,
    isAbnormal: !!data?.isAbnormal,
    isBudgetExceeded: !!data?.isBudgetExceeded
  };
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
  const data = await apiCall('setBudget', { roomId, monthlyBudget });
  return data || { monthlyBudget, dailyAllowance: 0, weeklyAllowance: 0, remainingDays: 0, daysInMonth: 30 };
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
  return await apiCall('getSetting', { key });
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