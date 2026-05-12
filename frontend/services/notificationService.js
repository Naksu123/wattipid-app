import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Notification Service for Wattipid
 * 
 * IMPORTANT: We use require() inside a try/catch instead of import.
 * In Expo Go SDK 53+, even importing expo-notifications triggers
 * TokenAutoRegistration.fx.js which crashes the entire app.
 * By using require() inside a try/catch, we prevent the crash.
 */

let Notifications = null;
const isExpoGo = Constants.appOwnership === 'expo';

function getNotificationsModule() {
  if (isExpoGo) {
    // Expo Go SDK 53+ crashes if we even try to load expo-notifications
    return null;
  }
  
  if (Notifications) return Notifications;
  try {
    Notifications = require('expo-notifications');
    return Notifications;
  } catch (e) {
    console.warn('expo-notifications could not be loaded:', e.message);
    return null;
  }
}

/**
 * Initialize local notification permissions.
 * Safe to call in Expo Go — will silently skip if module unavailable.
 */
export async function initNotifications() {
  const NotificationsModule = getNotificationsModule();
  if (!NotificationsModule) {
    console.log('Notifications not available in this environment.');
    return false;
  }

  try {
    NotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await NotificationsModule.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions denied.');
      return false;
    }

    // Create notification channels for Android
    if (Platform.OS === 'android') {
      // Main alerts channel
      await NotificationsModule.setNotificationChannelAsync('default', {
        name: 'Wattipid Alerts',
        importance: NotificationsModule.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22C55E',
      });

      // Budget alerts channel
      await NotificationsModule.setNotificationChannelAsync('budget_alerts', {
        name: 'Budget Alerts',
        description: 'Notifications when you exceed your electricity budget',
        importance: NotificationsModule.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#F59E0B',
      });

      // Consumption alerts channel
      await NotificationsModule.setNotificationChannelAsync('consumption_alerts', {
        name: 'Consumption Alerts',
        description: 'Notifications about abnormal electricity usage',
        importance: NotificationsModule.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EF4444',
      });

      // System channel
      await NotificationsModule.setNotificationChannelAsync('system_alerts', {
        name: 'System Notifications',
        description: 'System and maintenance notifications',
        importance: NotificationsModule.AndroidImportance.DEFAULT,
      });
    }

    console.log('Local notifications ready!');
    return true;
  } catch (e) {
    console.warn('Notification init skipped:', e.message);
    return false;
  }
}

/**
 * Send a local notification immediately.
 * Use for budget alerts, high consumption warnings, etc.
 */
export async function sendLocalNotification(title, body, data = {}) {
  const NotificationsModule = getNotificationsModule();
  if (!NotificationsModule) return;

  // Choose channel based on alert category
  let channelId = 'default';
  if (data?.category === 'budget') channelId = 'budget_alerts';
  else if (data?.category === 'consumption') channelId = 'consumption_alerts';
  else if (data?.category === 'system') channelId = 'system_alerts';

  try {
    await NotificationsModule.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: data?.severity === 'critical' ? 'high' : 'default',
        data: {
          screen: 'notifications',
          ...data,
        },
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('Failed to send notification:', error.message);
  }
}

/**
 * Schedule a future notification.
 */
export async function scheduleNotification(title, body, triggerSeconds = 60, data = {}) {
  const NotificationsModule = getNotificationsModule();
  if (!NotificationsModule) return;

  try {
    await NotificationsModule.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { screen: 'notifications', ...data },
      },
      trigger: { seconds: triggerSeconds },
    });
  } catch (error) {
    console.warn('Failed to schedule notification:', error.message);
  }
}

/**
 * Set up notification response handler for deep linking.
 * Call this once during app initialization.
 */
export function setupNotificationResponseHandler(router) {
  const NotificationsModule = getNotificationsModule();
  if (!NotificationsModule) return null;

  try {
    const subscription = NotificationsModule.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.screen === 'notifications') {
        // Navigate to the notifications screen when user taps the notification
        try {
          // Use navigate instead of push to prevent stack duplication/freezing
          router.navigate('/(tenant)/notifications');
        } catch (e) {
          console.warn('Navigation failed:', e.message);
        }
      }
    });
    return subscription;
  } catch (e) {
    console.warn('Notification response handler setup failed:', e.message);
    return null;
  }
}

/**
 * Get the Expo Push Token for this device.
 * Safe to call in Expo Go — will return null.
 */
export async function getPushToken() {
  const NotificationsModule = getNotificationsModule();
  if (!NotificationsModule) return null;

  try {
    const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await NotificationsModule.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    if (!projectId) {
       console.warn('Project ID missing from app config. Push notifications might not work.');
    }

    const token = (await NotificationsModule.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (e) {
    // If we are in dev and Firebase isn't set up, this is expected. Suppress the loud warning.
    if (e.message.includes('FirebaseApp is not initialized') || e.message.includes('FCM_CREDENTIALS')) {
      console.log('ℹ️ Push notifications skipped: Firebase not initialized (Production feature).');
    } else {
      console.warn('Error getting push token:', e.message);
    }
    return null;
  }
}

/**
 * Register the push token with the backend notification engine.
 * Uses the new notification API service.
 */
export async function registerPushTokenWithBackend(token, userId = null) {
  if (!token) {
    console.log('ℹ️ No push token available — skipping backend registration (dev mode).');
    return;
  }
  try {
    const { registerPushToken } = require('./notificationApi');
    await registerPushToken(token, userId);
    console.log('✅ Push token registered with backend notification engine!');
  } catch (e) {
    // Silently fail — push token registration is not critical for app function
    console.log('ℹ️ Push token registration skipped:', e.message);
  }
}

/**
 * Get the current badge count from the backend.
 */
export async function updateBadgeCount() {
  const NotificationsModule = getNotificationsModule();
  if (!NotificationsModule) return;

  try {
    const { getUnreadNotificationCount } = require('./notificationApi');
    const count = await getUnreadNotificationCount();
    await NotificationsModule.setBadgeCountAsync(count);
  } catch (e) {
    console.warn('Badge update failed:', e.message);
  }
}
