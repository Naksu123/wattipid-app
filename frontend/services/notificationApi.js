import { apiCall } from './api';

// ============ NOTIFICATION HISTORY ============

/**
 * Fetch notification history from the backend.
 */
export async function getNotificationHistory(category = null, limit = 50, offset = 0) {
  return await apiCall('getNotificationHistory', { category, limit, offset }) || [];
}

/**
 * Get unread notification count.
 */
export async function getUnreadNotificationCount() {
  const data = await apiCall('getUnreadNotificationCount');
  return data?.count || 0;
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId) {
  await apiCall('markNotificationRead', { notificationId });
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsRead() {
  await apiCall('markAllNotificationsRead');
}

/**
 * Delete a notification.
 */
export async function deleteNotification(notificationId) {
  await apiCall('deleteNotification', { notificationId });
}

// ============ ALERT SETTINGS ============

/**
 * Get alert threshold settings.
 */
export async function getAlertSettings(roomId) {
  return await apiCall('getAlertSettings', { roomId });
}

/**
 * Update alert threshold settings.
 */
export async function updateAlertSettings(roomId, settings) {
  await apiCall('updateAlertSettings', { roomId, settings });
}

// ============ FORECASTING ============

/**
 * Get monthly consumption forecast.
 */
export async function getMonthlyForecast(roomId, tenantName = null) {
  return await apiCall('getMonthlyForecast', { roomId, tenantName });
}

/**
 * Get peak hour predictions.
 */
export async function getPeakHourPrediction(roomId, tenantName = null) {
  return await apiCall('getPeakHourPrediction', { roomId, tenantName });
}

// ============ PUSH TOKEN ============

/**
 * Register push token with the backend notification engine.
 */
export async function registerPushToken(pushToken, userId = null, deviceName = null) {
  // Silent skip if no token or no userId (prevents red error boxes in dev)
  if (!pushToken) return;
  
  // If no explicit userId is provided, we rely on the backend session/auth headers.
  // We'll proceed but wrap it to ensure no red boxes show up.
  try {
    await apiCall('registerPushToken', { 
      pushToken, 
      userId, 
      deviceName,
      platform: 'android' 
    });
  } catch (e) {
    console.log('ℹ️ Push registration skipped or delayed:', e.message);
  }
}
