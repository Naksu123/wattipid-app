import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { DeviceEventEmitter, AppState } from 'react-native';
import { API_URL } from '../services/config';

const NetworkContext = createContext({});

export const useNetwork = () => useContext(NetworkContext);

/**
 * NetworkProvider — Expo Go compatible.
 * 
 * Uses a lightweight ping/polling approach instead of @react-native-community/netinfo
 * which requires a native development build. This polls the backend health endpoint
 * and uses fetch abort signals to detect timeouts, giving us reliable
 * isConnected / isInternetReachable / isSlow state.
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

    try {
      // Try to reach a lightweight endpoint on our own backend
      const response = await fetch(API_URL, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      const elapsed = Date.now() - startTime;
      // Any HTTP response at all (even 404) means the network is reachable
      const isReachable = true;
      const isSlow = elapsed > 3000; // >3s response = slow

      const newState = {
        isConnected: true,
        isInternetReachable: isReachable,
        type: 'unknown',
        isSlow,
      };

      setNetworkState(prev => {
        // Only update if something actually changed to avoid re-renders
        if (
          prev.isConnected !== newState.isConnected ||
          prev.isInternetReachable !== newState.isInternetReachable ||
          prev.isSlow !== newState.isSlow
        ) {
          // Emit event for non-React consumers (apiClient, etc.)
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

    // Also check when app comes back to foreground
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        checkConnectivity();
      }
      appStateRef.current = nextState;
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      appStateSub.remove();
    };
  }, []);

  return (
    <NetworkContext.Provider value={networkState}>
      {children}
    </NetworkContext.Provider>
  );
};
