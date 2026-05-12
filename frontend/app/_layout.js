import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { getDatabase } from '../services/database';
import { initNotifications, setupNotificationResponseHandler } from '../services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import ErrorTracker from '../services/errorTracker';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { COLORS } from '@/styles/theme';

// Custom dark theme to match Wattipid brand
const WattipidTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0B0F19',
    card: '#111827',
    text: '#F9FAFB',
    border: 'rgba(255, 255, 255, 0.08)',
    primary: '#10B981',
  },
};

function RootLayoutContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isVerifyScreen = segments.length > 1 && segments[1] === 'verify';
    
    if (!isAuthenticated) {
      if (!inAuthGroup) {
        // Force redirect to login
        router.replace('/(auth)/login');
      }
    } else {
      // User is authenticated
      if ((inAuthGroup && !isVerifyScreen) || segments.length === 0) {
        const target = user?.role === 'landlord' ? '/(landlord)/overview' : '/(tenant)/dashboard';
        router.replace(target);
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  // Set up deep linking for push notification taps
  useEffect(() => {
    const sub = setupNotificationResponseHandler(router);
    return () => { if (sub) sub.remove(); };
  }, [router]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.text}>Loading Wattipid...</Text>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await getDatabase();
      } catch (e) {
        ErrorTracker.log('Init', 'Database initialization failed', e, 'Check if SQLite is properly linked.');
      }
      initNotifications().catch((e) => {
        ErrorTracker.log('Init', 'Notification initialization failed', e);
      });
      setReady(true);
    };
    init();
  }, []);

  if (!ready) return null;

  return (
    <ThemeProvider value={WattipidTheme}>
      <AuthProvider>
        <StatusBar style="light" />
        <RootLayoutContent />
      </AuthProvider>
    </ThemeProvider>
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
