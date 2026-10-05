import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { DeviceEventEmitter, AppState } from 'react-native';
import { API_URL, getActiveBaseUrl } from '../services/config';

const NetworkContext = createContext({});

export const useNetwork = () => useContext(NetworkContext);

/**
 * NetworkProvider — Production hardened connectivity monitoring.
 * 
 * Uses a dedicated lightweight health action (/api.php?action=health)
 * with timeout abort signals. Detects backend availability, network status,
 * and emits 'networkStatusChanged' events to synchronize ApiClient and SyncEngine.
 */
export const NetworkProvider = ({ children }) => {
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    isSlow: false,
  });

  const intervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const checkConnectivity = async () => {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const activeUrl = getActiveBaseUrl() || API_URL;

    try {
      // Connect to lightweight backend health endpoint
      const response = await fetch(`${activeUrl}/api.php?action=health`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      const elapsed = Date.now() - startTime;
      const isReachable = response.ok || response.status < 500;
      const isSlow = elapsed > 3000; // >3s response = slow

      const newState = {
        isConnected: true,
        isInternetReachable: isReachable,
        type: 'unknown',
        isSlow,
      };

      setNetworkState(prev => {
        if (
          prev.isConnected !== newState.isConnected ||
          prev.isInternetReachable !== newState.isInternetReachable ||
          prev.isSlow !== newState.isSlow
        ) {
          if (!newState.isConnected || !newState.isInternetReachable) {
            DeviceEventEmitter.emit('networkStatusChanged', 'offline');
          } else if (newState.isSlow) {
            DeviceEventEmitter.emit('networkStatusChanged', 'slow');
          } else {
            DeviceEventEmitter.emit('networkStatusChanged', 'online');
          }
          return newState;
        }
        return prev;
      });
    } catch (error) {
      clearTimeout(timeoutId);

      const newState = {
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
        isSlow: false,
      };

      setNetworkState(prev => {
        if (prev.isConnected !== false || prev.isInternetReachable !== false) {
          DeviceEventEmitter.emit('networkStatusChanged', 'offline');
          return newState;
        }
        return prev;
      });
    }
  };

  useEffect(() => {
    // Initial check
    checkConnectivity();

    // Poll every 10 seconds
    intervalRef.current = setInterval(checkConnectivity, 10000);

    // Re-check when app returns from background
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        checkConnectivity();
      }
      appStateRef.current = nextState;
    });

    // Re-check when API base URL changes
    const urlSub = DeviceEventEmitter.addListener('apiBaseUrlChanged', () => {
      checkConnectivity();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      appStateSub.remove();
      urlSub.remove();
    };
  }, []);

  return (
    <NetworkContext.Provider value={networkState}>
      {children}
    </NetworkContext.Provider>
  );
};
