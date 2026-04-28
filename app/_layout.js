import React, { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { getDatabase } from '../services/database';
import { registerForPushNotificationsAsync } from '../services/notificationService';

function NotificationHandler({ children }) {
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotificationsAsync();
    }
  }, [isAuthenticated]);

  return children;
}

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await getDatabase();
      } catch (e) {
        console.error('DB init error:', e);
      }
      setDbReady(true);
    };
    init();
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.text}>Loading Wattipid...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <NotificationHandler>
        <StatusBar style="light" />
        <Slot />
      </NotificationHandler>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 14,
  },
});
