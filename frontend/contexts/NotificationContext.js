import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useSync } from './SyncContext';

const NotificationContext = createContext({});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { unreadCount, forceSync } = useSync();
  const [bannerConfig, setBannerConfig] = useState(null);
  const notificationListener = useRef();

  // Setup foreground push listener
  useEffect(() => {
    try {
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        // Force a sync to update the unread count immediately
        forceSync();
      });

      return () => {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
      };
    } catch (e) {
      console.log('Foreground push listener not active.');
    }
  }, [forceSync]);

  /**
   * Display a global heads-up banner.
   * @param {string} title 
   * @param {string} message 
   * @param {string} type - 'info', 'warning', 'critical', 'success'
   * @param {object} data - Attached payload
   */
  const showBanner = (title, message, type = 'info', data = {}) => {
    setBannerConfig({
      id: Date.now().toString(), // Unique ID to re-trigger animations
      title,
      message,
      type,
      data
    });
  };

  const hideBanner = () => {
    setBannerConfig(null);
  };

  const refreshUnreadCount = () => {
    forceSync();
  };

  return (
    <NotificationContext.Provider value={{
      unreadCount, // Passed through from SyncContext
      refreshUnreadCount,
      showBanner,
      hideBanner,
      bannerConfig,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
