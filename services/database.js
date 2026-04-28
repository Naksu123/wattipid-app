import { apiCall } from './api';

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

export async function updateRoomStatus(roomId, status, tenantName = null, startDate = null) {
  await apiCall('updateRoomStatus', { roomId, status, tenantName, startDate });
}

export async function generateNewTenantCode(roomId) {
  return await apiCall('generateNewTenantCode', { roomId });
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
  await apiCall('saveTenantInvitation', { email, roomId, tenantCode });
}

export async function getTenantInvitationByEmail(email) {
  return await apiCall('getTenantInvitationByEmail', { email });
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
    energy: parseFloat(d.energy || 0),
    cost: parseFloat(d.cost || 0),
    avgPower: parseFloat(d.avgPower || 0),
    peakPower: parseFloat(d.peakPower || 0),
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

export async function getTransactionHistory(roomId, limit = 50, period = 'all', tenantName = null, offset = 0) {
  const data = await apiCall('getTransactionHistory', { roomId, limit, period, tenantName, offset });
  return (data || []).map(tx => ({
    ...tx,
    voltage: parseFloat(tx.voltage || 0),
    current_val: parseFloat(tx.current_val || 0),
    power: parseFloat(tx.power || 0),
    energy: parseFloat(tx.energy || 0),
    cost: parseFloat(tx.cost || 0),
  }));
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
    energyPctChange 
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