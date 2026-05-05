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

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions denied.');
      return false;
    }

    if (Platform.OS === 'android') {
      await NotificationsModule.setNotificationChannelAsync('default', {
        name: 'Wattipid Alerts',
        importance: NotificationsModule.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22C55E',
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
export async function sendLocalNotification(title, body) {
  const NotificationsModule = getNotificationsModule();
  if (!NotificationsModule) return;

  try {
    await NotificationsModule.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: 'high',
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('Failed to send notification:', error.message);
  }
}
