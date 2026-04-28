import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiCall } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Constants.appOwnership === 'expo') {
    console.log('Push notifications are not supported in Expo Go for SDK 53+. Use a Development Build for this feature.');
    return null;
  }

  let token;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }

  try {
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id' // Get this from app.json / Expo dashboard
    })).data;
    
    // Send token to backend
    await apiCall('updatePushToken', { pushToken: token });
  } catch (e) {
    console.error('Error getting push token', e);
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

export async function sendLocalNotification(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { data: 'goes here' },
    },
    trigger: null, // immediate
  });
}
