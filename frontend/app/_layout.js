import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { getDatabase } from '../services/database';
import { initNotifications, setupNotificationResponseHandler } from '../services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import ErrorTracker from '../services/errorTracker';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { COLORS } from '@/styles/theme';
import { SyncProvider } from '@/contexts/SyncContext';
import GlobalToast from '@/components/ui/GlobalToast';
import NotificationBanner from '@/components/ui/NotificationBanner';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { globalStyles } from '../styles/global.styles';

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

    // Determine current group
    const inAuthGroup = segments[0] === '(auth)';
    const inTenantGroup = segments[0] === '(tenant)';
    const inLandlordGroup = segments[0] === '(landlord)';
    
    console.log(`[Navigation] Path: /${segments.join('/')} | Auth: ${isAuthenticated}`);

    if (!isAuthenticated) {
      // If not authenticated and NOT in auth group, go to login
      if (!inAuthGroup) {
        const target = '/(auth)/login';
        if (segments.join('/') !== '(auth)/login') {
            console.log(`[Navigation] Redirecting to Login...`);
            router.replace(target);
        }
      }
    } else {
      // User is authenticated
      const isVerifyScreen = segments[1] === 'verify';
      const atRoot = segments.length === 0;

      if ((inAuthGroup && !isVerifyScreen) || atRoot) {
        const target = user?.role === 'landlord' ? '/(landlord)/overview' : '/(tenant)/dashboard';
        const currentPath = `/${segments.join('/')}`;
        if (currentPath !== target) {
            console.log(`[Navigation] Redirecting to Dashboard: ${target}`);
            router.replace(target);
        }
      }
    }
  }, [isAuthenticated, isLoading, segments, user?.role]);

  // Set up deep linking for push notification taps
  useEffect(() => {
    const sub = setupNotificationResponseHandler(router);
    return () => { if (sub) sub.remove(); };
  }, [router]);

  if (isLoading) {
    return (
      <View style={globalStyles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={globalStyles.loadingText}>Loading Wattipid...</Text>
      </View>
    );
  }

  return (
    <>
      <Slot />
      <GlobalToast />
      <NotificationBanner />
    </>
  );
}

import { NotificationProvider } from '@/contexts/NotificationContext';

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={WattipidTheme}>
        <AuthProvider>
          <SyncProvider>
            <NotificationProvider>
              <StatusBar style="light" />
              <RootLayoutContent />
            </NotificationProvider>
          </SyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}


