import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform, DeviceEventEmitter, AppState } from 'react-native';
import { apiCall } from '../services/api';
import { FailureCategory } from '../services/apiClient';
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

const BASE_SYNC_INTERVAL_MS = 4000;  // 4s normal polling
const MAX_BACKOFF_INTERVAL_MS = 60000; // 60s max backoff

/**
 * Calculates bounded exponential backoff with randomized jitter (+/- 15%).
 */
function calculateBackoffWithJitter(consecutiveErrors) {
  if (consecutiveErrors <= 0) return BASE_SYNC_INTERVAL_MS;
  // 4s * 2^(n-1): 4s, 8s, 16s, 32s, capped at 60s
  const expDelay = Math.min(BASE_SYNC_INTERVAL_MS * Math.pow(2, consecutiveErrors - 1), MAX_BACKOFF_INTERVAL_MS);
  const jitter = (Math.random() * 0.3 - 0.15) * expDelay;
  return Math.max(3000, Math.min(MAX_BACKOFF_INTERVAL_MS, Math.round(expDelay + jitter)));
}

export const SyncProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [pushToken, setPushToken] = useState(null);

  // In-flight guard and state preservation
  const isSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef('2000-01-01 00:00:00');
  const abortControllerRef = useRef(null);

  // Real-time Global States
  const [unreadCount, setUnreadCount] = useState(0);
  const [globalRefreshTick, setGlobalRefreshTick] = useState(0);
  const [landlordSyncData, setLandlordSyncData] = useState(null);

  // Scheduling and backoff refs
  const syncTimeoutRef = useRef(null);
  const syncTickRef = useRef(0);
  const consecutiveErrorsRef = useRef(0);
  const isOnlineRef = useRef(true);
  const appStateRef = useRef(AppState.currentState);

  // Diagnostic logging deduplication tracker
  const lastLoggedErrorRef = useRef({
    category: null,
    status: null,
    lastTime: 0,
    suppressedCount: 0,
  });

  // Keep isOnlineRef in sync
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  // Push Notifications Setup
  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          setPushToken(token);
          apiCall('updatePushToken', { pushToken: token }, { isBackgroundSync: true }).catch(() => {});
        }
      });
    }
  }, [isAuthenticated]);

  /**
   * Clears any scheduled sync timeout safely.
   */
  const clearSyncTimer = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, []);

  /**
   * The Core Sync Engine function.
   * Features:
   * - Overlap protection
   * - Clean AbortController support
   * - Bounded exponential backoff with jitter
   * - Throttled diagnostic logging (no repeated identical warnings)
   * - Automatic recovery logging
   */
  const performSync = useCallback(async (isManualTrigger = false) => {
    if (!isAuthenticated) return;

    // Avoid overlapping synchronization jobs
    if (isSyncingRef.current) {
      if (isManualTrigger) {
        // Manual forceSync called while already syncing: don't spawn duplicate
        return;
      }
      return;
    }

    // Do not attempt synchronization if device is confirmed offline
    if (!isOnlineRef.current) {
      return;
    }

    syncTickRef.current += 1;
    isSyncingRef.current = true;

    // Create fresh AbortController for this sync request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const currentAbortController = new AbortController();
    abortControllerRef.current = currentAbortController;

    let hasError = false;
    let nextDelay = BASE_SYNC_INTERVAL_MS;

    try {
      // Throttle heavy landlord queries to every 3rd tick (12s) to protect server CPU
      const requestLandlordData = (syncTickRef.current % 3 === 0);

      const res = await apiCall('syncState', {
        roomId: user?.room_id,
        last_sync_timestamp: lastSyncTimeRef.current,
        request_landlord_data: requestLandlordData
      }, {
        isBackgroundSync: true,
        timeout: 8000,
        signal: currentAbortController.signal
      });

      if (res) {
        const isFirstSync = lastSyncTimeRef.current === '2000-01-01 00:00:00';
        lastSyncTimeRef.current = res.server_timestamp;

        // Authoritative unread count from backend
        if (typeof res.unread_notifications_count === 'number') {
          setUnreadCount(res.unread_notifications_count);
        } else if (res.new_notifications_count > 0) {
          setUnreadCount(prev => prev + res.new_notifications_count);
        }

        // Trigger toast for new notifications that arrived after initial sync
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

        // Full UI refresh trigger
        if (res.trigger_full_refresh) {
          setGlobalRefreshTick(prev => prev + 1);
        }

        // Real-Time Landlord Data streaming
        if (res.landlord_sync_data) {
          setLandlordSyncData(res.landlord_sync_data);
        }
      }

      // Successful sync recovery logging
      if (consecutiveErrorsRef.current > 0) {
        console.log(`[Sync Engine] Connection restored. Synchronized successfully (Server time: ${res?.server_timestamp || 'OK'}, recovered after ${consecutiveErrorsRef.current} failed attempt(s)).`);
      }

      consecutiveErrorsRef.current = 0;
      lastLoggedErrorRef.current = { category: null, status: null, lastTime: 0, suppressedCount: 0 };
      setIsOnline(true);
      nextDelay = BASE_SYNC_INTERVAL_MS;

    } catch (e) {
      hasError = true;
      const isCanceled = e?.name === 'CanceledError' || e?.message === 'canceled' || e?.message === 'Logging out';
      if (isCanceled) {
        return;
      }

      consecutiveErrorsRef.current += 1;
      const errorCategory = e?.category || (e?.response?.status === 401 ? FailureCategory.HTTP_UNAUTHORIZED : FailureCategory.API_UNREACHABLE);
      const errorStatus = e?.status || e?.response?.status || null;
      const diagMessage = e?.diagnosticMessage || e?.message || 'Unable to establish connection to backend';
      const timestamp = e?.timestamp || new Date().toISOString();

      nextDelay = calculateBackoffWithJitter(consecutiveErrorsRef.current);

      // Handle Authentication Failure specifically
      if (errorCategory === FailureCategory.HTTP_UNAUTHORIZED) {
        // Back off heavily when session is unauthorized — do not spam server
        nextDelay = MAX_BACKOFF_INTERVAL_MS;
      } else if (errorCategory === FailureCategory.NETWORK_UNAVAILABLE) {
        setIsOnline(false);
      } else {
        setIsOnline(false);
      }

      // Diagnostic Logging with Deduplication & Throttling
      const lastLogged = lastLoggedErrorRef.current;
      const isNewFailureCategory = lastLogged.category !== errorCategory || lastLogged.status !== errorStatus;

      if (isNewFailureCategory) {
        // Log immediately when failure starts or changes category
        console.warn(`[Sync Engine Error] [${errorCategory}] syncState: ${diagMessage} (Status: ${errorStatus || 'N/A'}, Time: ${timestamp})`);
        lastLoggedErrorRef.current = {
          category: errorCategory,
          status: errorStatus,
          lastTime: Date.now(),
          suppressedCount: 0
        };
      } else {
        lastLogged.suppressedCount += 1;
        // Throttle: Log aggregated summary only every 5 suppressed ticks to prevent console flood
        if (lastLogged.suppressedCount % 5 === 0) {
          console.warn(`[Sync Engine] [${errorCategory}] syncState: Connection failure persists (${consecutiveErrorsRef.current} attempts, next retry in ${Math.round(nextDelay / 1000)}s)`);
        }
      }

    } finally {
      isSyncingRef.current = false;

      // Schedule next execution dynamically if authenticated and online
      clearSyncTimer();
      if (isAuthenticated && isOnlineRef.current) {
        syncTimeoutRef.current = setTimeout(() => {
          performSync(false);
        }, nextDelay);
      }
    }
  }, [isAuthenticated, user?.room_id, clearSyncTimer]);

  /**
   * Schedule sync helper with explicit delay.
   */
  const scheduleSync = useCallback((delayMs = 0) => {
    clearSyncTimer();
    if (!isAuthenticated) return;

    if (delayMs === 0) {
      performSync(false);
    } else {
      syncTimeoutRef.current = setTimeout(() => {
        performSync(false);
      }, delayMs);
    }
  }, [clearSyncTimer, isAuthenticated, performSync]);

  // Manage sync cycle lifecycle and network events
  useEffect(() => {
    if (!isAuthenticated) {
      clearSyncTimer();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    // Initial sync
    scheduleSync(0);

    // Listen to network status changes from NetworkProvider
    const networkSub = DeviceEventEmitter.addListener('networkStatusChanged', (status) => {
      if (status === 'offline') {
        setIsOnline(false);
        clearSyncTimer();
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      } else if (status === 'online') {
        setIsOnline(true);
        consecutiveErrorsRef.current = 0;
        console.log('[Sync Engine] Network restored. Resuming synchronization.');
        scheduleSync(0); // Trigger immediate sync upon reconnect
      }
    });

    // Re-sync when app returns from background
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        if (isOnlineRef.current) {
          scheduleSync(0);
        }
      }
      appStateRef.current = nextState;
    });

    return () => {
      clearSyncTimer();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      networkSub.remove();
      appStateSub.remove();
    };
  }, [isAuthenticated, clearSyncTimer, scheduleSync]);

  // Exposed manual trigger function
  const handleForceSync = useCallback(() => {
    if (isSyncingRef.current) {
      return Promise.resolve();
    }
    return performSync(true);
  }, [performSync]);

  return (
    <SyncContext.Provider value={{ 
      isOnline, 
      isSyncing: isSyncingRef.current, 
      unreadCount, 
      setUnreadCount,
      globalRefreshTick,
      landlordSyncData,
      forceSync: handleForceSync
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
    return;
  }
  try {
    const projectId = 'ffda4eb9-069b-49fa-8fb4-22459a7ad689';
    token = (await Notifications.getExpoPushTokenAsync({
      projectId, 
    })).data;
  } catch (e) {
    // Non-fatal if push token retrieval fails in dev environment
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
