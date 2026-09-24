import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform, DeviceEventEmitter } from 'react-native';
import { apiCall } from '../services/api';
import { useAuth } from './AuthContext';
import * as Notifications from 'expo-notifications';

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
  const [landlordSyncData, setLandlordSyncData] = useState(null);

  const syncInterval = useRef(null);
  const syncTickRef = useRef(0);
  const consecutiveErrorsRef = useRef(0);

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

  // 3. The Core Sync Engine (Adaptive Polling: 2s online, 6s on connection drops)
  const performSync = useCallback(async () => {
    if (!isAuthenticated || isSyncingRef.current) return;

    syncTickRef.current += 1;

    // Adaptive backoff: If connection is failing, relax polling to every 3rd tick (6s)
    if (consecutiveErrorsRef.current >= 3 && (syncTickRef.current % 3 !== 0)) {
      return;
    }

    try {
      isSyncingRef.current = true;

      // Throttle heavy landlord queries to every 3rd tick (6 seconds) to protect database CPU
      const requestLandlordData = (syncTickRef.current % 3 === 0);

      const res = await apiCall('syncState', {
        roomId: user?.room_id,
        last_sync_timestamp: lastSyncTimeRef.current,
        request_landlord_data: requestLandlordData
      });

      // apiCall bridge returns response.data.data, so there is no .success property here
      if (res) {
        const isFirstSync = lastSyncTimeRef.current === '2000-01-01 00:00:00';
        lastSyncTimeRef.current = res.server_timestamp;
        
        // Authoritative unread count from backend
        if (typeof res.unread_notifications_count === 'number') {
          setUnreadCount(res.unread_notifications_count);
        } else if (res.new_notifications_count > 0) {
          setUnreadCount(prev => prev + res.new_notifications_count);
        }
        
        // Trigger toast for new notifications that arrived after the initial sync
        if (!isFirstSync && res.new_notifications_count > 0 && Array.isArray(res.new_notifications)) {
          res.new_notifications.forEach(notif => {
            DeviceEventEmitter.emit('showBanner', { 
              title: notif.title || (notif.severity === 'critical' ? 'Urgent Alert' : 'Notification'),
              message: notif.message, 
              type: notif.severity === 'critical' ? 'error' : 'info',
              data: notif
            });
          });
        }

        // If the server says there's a major update (payment, bill, activity)
        if (res.trigger_full_refresh) {
          setGlobalRefreshTick(prev => prev + 1);
        }

        // Real-Time Landlord Data streaming
        if (res.landlord_sync_data) {
          setLandlordSyncData(res.landlord_sync_data);
        }
      }
      
      // If we made it here, connection is healthy
      consecutiveErrorsRef.current = 0;
      setIsOnline(true);
      
    } catch (e) {
      // 401 Unauthorized usually means the token expired, not offline.
      // 429 means too many requests, also not offline.
      if (e?.response?.status === 401 || e?.response?.status === 429) {
        console.warn(`Sync Engine Error (${e.response.status}):`, e.message);
      } else {
        console.warn("Sync Engine Error:", e.message);
        // Track consecutive network failure and back off
        consecutiveErrorsRef.current += 1;
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
        syncInterval.current = setInterval(performSync, 4000); // 4 SECOND POLLING (Prevents JS thread congestion and battery drain)
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
      landlordSyncData,
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
