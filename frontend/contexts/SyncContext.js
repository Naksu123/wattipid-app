import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { apiCall } from '../services/api';
import { useAuth } from './AuthContext';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configure Push Notifications Behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const SyncContext = createContext({});

export const useSync = () => useContext(SyncContext);

export const SyncProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [pushToken, setPushToken] = useState(null);
  
  // Use refs to avoid recreating the performSync callback constantly
  const isSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef('2000-01-01 00:00:00');
  
  // Real-time Global States
  const [unreadCount, setUnreadCount] = useState(0);
  const [globalRefreshTick, setGlobalRefreshTick] = useState(0);

  const syncInterval = useRef(null);

  // 1. Network Connectivity Monitoring
  // Fallback to assuming online initially.
  // We'll update isOnline based on whether the Sync API call succeeds or fails.

  // 2. Setup Expo Push Notifications
  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          setPushToken(token);
          // Send to backend
          apiCall('updatePushToken', { pushToken: token }).catch(() => {});
        }
      });
    }
  }, [isAuthenticated]);

  // 3. The Core Sync Engine (1 Second Polling)
  const performSync = useCallback(async () => {
    if (!isAuthenticated || isSyncingRef.current) return;

    try {
      isSyncingRef.current = true;
      const res = await apiCall('syncState', {
        roomId: user?.room_id,
        last_sync_timestamp: lastSyncTimeRef.current
      });

      if (res && res.success) {
        lastSyncTimeRef.current = res.server_timestamp;
        
        if (res.new_notifications_count > 0) {
          setUnreadCount(prev => prev + res.new_notifications_count);
        }

        // If the server says there's a major update (payment, bill, activity)
        if (res.trigger_full_refresh) {
          setGlobalRefreshTick(prev => prev + 1);
        }
      }
      
      // If we made it here, we are online
      setIsOnline(true);
      
    } catch (e) {
      // 401 Unauthorized usually means the token expired, not offline.
      // 429 means too many requests, also not offline.
      if (e?.response?.status === 401 || e?.response?.status === 429) {
        console.warn(`Sync Engine Error (${e.response.status}):`, e.message);
      } else {
        console.warn("Sync Engine Error:", e.message);
        // If it's a network error (like timeout), assume offline
        setIsOnline(false);
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [isAuthenticated, user?.room_id]);

  useEffect(() => {
    if (isAuthenticated) {
      performSync(); // Initial sync
      // Create interval ONLY ONCE
      if (!syncInterval.current) {
        syncInterval.current = setInterval(performSync, 2000); // 2 SECOND POLLING (Slightly relaxed to avoid 429)
      }
    }

    return () => {
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
        syncInterval.current = null;
      }
    };
  }, [isAuthenticated, performSync]);

  return (
    <SyncContext.Provider value={{ 
      isOnline, 
      isSyncing: isSyncingRef.current, 
      unreadCount, 
      setUnreadCount,
      globalRefreshTick,
      forceSync: performSync
    }}>
      {children}
    </SyncContext.Provider>
  );
};

// Helper to register Expo Push Token
async function registerForPushNotificationsAsync() {
  let token;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return;
  }
  try {
    // Expo Go sometimes loses Constants.expoConfig in certain environments.
    // Hardcoding the projectId matching app.json to guarantee token retrieval.
    const projectId = 'ffda4eb9-069b-49fa-8fb4-22459a7ad689';
    token = (await Notifications.getExpoPushTokenAsync({
      projectId, 
    })).data;
  } catch (e) {
    console.warn(e);
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
